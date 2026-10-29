import type { CartLine } from '@/contracts/cart';

export function exceedsAvailability(line: CartLine) {
  return line.quantity > line.available;
}
