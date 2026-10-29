import { readDb, transaction } from '../db/store';
import { settleDueOrders } from '../domain/orders';

const timers = new Map<string, ReturnType<typeof setTimeout>>();

/** Reads also settle due orders, so a reload that drops these timers never loses a settlement. */
export function scheduleSettlements() {
  for (const order of readDb().orders) {
    if (order.status !== 'pending' || timers.has(order.id)) continue;
    const timer = setTimeout(
      () => {
        timers.delete(order.id);
        transaction(settleDueOrders);
      },
      Math.max(0, Date.parse(order.settlesAt) - Date.now()),
    );
    timers.set(order.id, timer);
  }
}

export function cancelSettlements() {
  timers.forEach(clearTimeout);
  timers.clear();
}
