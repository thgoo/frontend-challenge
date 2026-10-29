import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts/events';

export type MockEvent = NftUpdatedEvent | OrderUpdatedEvent;

export interface Delivery {
  event: MockEvent;
  /** `null` broadcasts to every connected client. */
  recipientUserId: string | null;
}

type Listener = (delivery: Delivery) => void;
const listeners = new Set<Listener>();

export function publish(delivery: Delivery) {
  for (const listener of listeners) listener(delivery);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
