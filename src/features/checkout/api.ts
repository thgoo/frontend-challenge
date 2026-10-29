import { z } from 'zod';
import { IDEMPOTENCY_HEADER, orderSchema, type CreateOrderInput } from '@/contracts/order';
import { quoteSchema } from '@/contracts/quote';
import type { Network } from '@/contracts/wallet';
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
