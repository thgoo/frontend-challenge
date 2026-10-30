import { z } from 'zod';
import { IDEMPOTENCY_HEADER, orderSchema, type CreateOrderInput } from '@/contracts/order';
import { quoteSchema } from '@/contracts/quote';
import {
  walletConnectionSchema,
  type Network,
  type WalletConnectionInput,
} from '@/contracts/wallet';
import { request } from '@/lib/http';

export function createQuote(network: Network) {
  return request(quoteSchema, { method: 'POST', url: '/quotes', data: { network } });
}

export function placeOrder({
  input,
  idempotencyKey,
}: {
  input: CreateOrderInput;
  idempotencyKey: string;
}) {
  return request(orderSchema, {
    method: 'POST',
    url: '/orders',
    data: input,
    headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
  });
}

export function fetchOrders(signal?: AbortSignal) {
  return request(z.array(orderSchema), { url: '/orders', signal });
}

export function fetchOrder(id: string, signal?: AbortSignal) {
  return request(orderSchema, { url: `/orders/${encodeURIComponent(id)}`, signal });
}

export function fetchWalletConnection(signal?: AbortSignal) {
  return request(walletConnectionSchema.nullable(), { url: '/wallet-connection', signal });
}

export function connectWallet(input: WalletConnectionInput) {
  return request(walletConnectionSchema, { method: 'PUT', url: '/wallet-connection', data: input });
}
