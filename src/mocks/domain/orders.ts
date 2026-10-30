import type { CartItemInput } from '@/contracts/cart';
import type { CreateOrderInput, Order, OrderStatus } from '@/contracts/order';
import { priceSummarySchema, type PriceSummary } from '@/contracts/pricing';
import type { Quote } from '@/contracts/quote';
import type { Network } from '@/contracts/wallet';
import { formatEth } from '@/lib/eth';
import type { CartRecord, OrderRecord, UserRecord } from '../db/types';
import { createRandom } from '../db/random';
import { priceCart, removePurchasedItems, userCart, type PricedCart } from './carts';
import { orderUpdatedEvent } from './events';
import { nextId } from './ids';
import { adjustAvailability } from './inventory';
import { lineTotal } from './pricing';
import { fail, ok, type Result } from './result';
import type { Tx } from './tx';
import { FIELD_ERRORS } from '@/contracts/field-errors';

const QUOTE_TTL_MS = 10 * 60_000;

const EXPLORERS: Record<Network, string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  arbitrum: 'https://arbiscan.io/tx/',
  base: 'https://basescan.org/tx/',
};

function quotablePricing(tx: Tx, cart: CartRecord, network: Network): Result<PricedCart> {
  const priced = priceCart(tx.db, cart, network, tx.now);
  if (!priced.ok) return priced;
  if (priced.value.lines.length === 0) return fail(409, 'CONFLICT', 'Your cart is empty.');

  const unavailable = priced.value.lines.find((line) => line.quantity > line.available);
  if (unavailable) {
    return fail(
      409,
      'AVAILABILITY_CONFLICT',
      `Only ${unavailable.available} of "${unavailable.nftName} – ${unavailable.editionName}" are available.`,
    );
  }
  return priced;
}

type PricedLine = CartItemInput & { unitPriceEth: string };

function pricingFingerprint(lines: readonly PricedLine[], summary: PriceSummary) {
  const items = lines.map(({ nftId, editionId, quantity, unitPriceEth }) => [
    nftId,
    editionId,
    quantity,
    unitPriceEth,
  ]);
  return JSON.stringify({ items, summary: priceSummarySchema.parse(summary) });
}

export function createQuote(tx: Tx, userId: string, network: Network): Result<Quote> {
  const priced = quotablePricing(tx, userCart(tx, userId), network);
  if (!priced.ok) return priced;

  const quote: Quote = {
    id: nextId(tx.db, 'qt'),
    ...priced.value.summary,
    lines: priced.value.lines.map(({ available, maxPerOrder, ...line }) => ({
      ...line,
      lineTotalEth: formatEth(lineTotal(line)),
    })),
    expiresAt: new Date(tx.now + QUOTE_TTL_MS).toISOString(),
  };
  tx.db.quotes.push({ ...quote, userId });
  return ok(quote);
}

export function toOrderDto(record: OrderRecord): Order {
  const {
    userId,
    quoteId,
    idempotencyKey,
    requestFingerprint,
    settlesAt,
    plannedOutcome,
    ...order
  } = record;
  return order;
}

function validateQuote(tx: Tx, user: UserRecord, input: CreateOrderInput): Result<Quote> {
  const quote = tx.db.quotes.find(
    (candidate) => candidate.id === input.quoteId && candidate.userId === user.id,
  );
  const outdated = fail(
    409,
    'QUOTE_OUTDATED',
    'Prices or availability changed. Review your order again.',
  );
  if (!quote || Date.parse(quote.expiresAt) <= tx.now) return outdated;
  if (tx.db.orders.some((order) => order.quoteId === quote.id)) return outdated;
  if (quote.network !== input.network) {
    return fail(422, 'VALIDATION_FAILED', 'The network does not match the quote.', {
      network: FIELD_ERRORS.networkChanged,
    });
  }

  const current = quotablePricing(tx, userCart(tx, user.id), quote.network);
  if (!current.ok) return current;
  const { lines, summary } = current.value;
  if (pricingFingerprint(quote.lines, quote) !== pricingFingerprint(lines, summary)) {
    return outdated;
  }
  return ok(quote);
}

export interface PlaceOrderOptions {
  idempotencyKey: string;
  outcome: Exclude<OrderStatus, 'pending'>;
  settleAfterMs: number;
}

export function placeOrder(
  tx: Tx,
  user: UserRecord,
  input: CreateOrderInput,
  options: PlaceOrderOptions,
): Result<{ order: Order; replayed: boolean }> {
  const fingerprint = JSON.stringify(input);
  const previous = tx.db.orders.find(
    (order) => order.userId === user.id && order.idempotencyKey === options.idempotencyKey,
  );
  if (previous) {
    if (previous.requestFingerprint !== fingerprint) {
      return fail(
        409,
        'IDEMPOTENCY_CONFLICT',
        'This idempotency key was already used for another order.',
      );
    }
    return ok({ order: toOrderDto(previous), replayed: true });
  }

  const wallet = tx.db.wallets[user.id]?.find((candidate) => candidate.id === input.walletId);
  if (!wallet) {
    return fail(422, 'VALIDATION_FAILED', 'Select one of your wallets.', {
      walletId: FIELD_ERRORS.walletRequired,
    });
  }

  const connection = tx.db.walletConnections[user.id];
  if (connection?.walletId !== input.walletId || connection.network !== input.network) {
    return fail(
      409,
      'WALLET_DISCONNECTED',
      'Connect the selected wallet on this network to continue.',
    );
  }

  const quote = validateQuote(tx, user, input);
  if (!quote.ok) return quote;
  const { id: quoteId, expiresAt, ...receipt } = quote.value;
  for (const line of receipt.lines) adjustAvailability(tx, line, -line.quantity);

  const timestamp = new Date(tx.now).toISOString();
  const order: OrderRecord = {
    id: nextId(tx.db, 'ord'),
    status: 'pending',
    receipt,
    buyer: input.buyer,
    walletAddress: wallet.address,
    txHash: null,
    explorerUrl: null,
    failureReason: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 1,
    userId: user.id,
    quoteId,
    idempotencyKey: options.idempotencyKey,
    requestFingerprint: fingerprint,
    settlesAt: new Date(tx.now + options.settleAfterMs).toISOString(),
    plannedOutcome: options.outcome,
  };
  tx.db.orders.push(order);
  return ok({ order: toOrderDto(order), replayed: false });
}

function simulatedTxHash(orderId: string): string {
  const random = createRandom(Number(orderId.replace(/\D/g, '')));
  return `0x${Array.from({ length: 64 }, () => Math.floor(random() * 16).toString(16)).join('')}`;
}

function settle(tx: Tx, order: OrderRecord) {
  order.status = order.plannedOutcome;
  order.version += 1;
  order.updatedAt = new Date(tx.now).toISOString();

  if (order.status === 'confirmed') {
    order.txHash = simulatedTxHash(order.id);
    order.explorerUrl = `${EXPLORERS[order.receipt.network]}${order.txHash}`;
    removePurchasedItems(userCart(tx, order.userId), order.receipt.lines);
  } else {
    order.failureReason = 'The payment was declined by the wallet.';
    for (const line of order.receipt.lines) adjustAvailability(tx, line, line.quantity);
  }
  tx.emit(orderUpdatedEvent(tx.db, toOrderDto(order), tx.now), order.userId);
}

export function settleDueOrders(tx: Tx) {
  for (const order of tx.db.orders) {
    if (order.status === 'pending' && Date.parse(order.settlesAt) <= tx.now) settle(tx, order);
  }
}
