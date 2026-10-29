import type { Network } from '@/contracts/wallet';
import type { Coupon, PriceSummary } from '@/contracts/pricing';
import { applyBasisPoints, formatEth, parseEth, sumEth } from '@/lib/eth';
import type { DbState } from '../db/types';
import { fail, ok, type Result } from './result';

export const DEFAULT_NETWORK: Network = 'ethereum';

export const NETWORK_FEES: Record<Network, string> = {
  ethereum: '0.0021',
  polygon: '0.0001',
  arbitrum: '0.0003',
  base: '0.0002',
};

export function findCoupon(db: DbState, code: string, now: number): Result<Coupon> {
  const coupon = db.coupons.find((candidate) => candidate.code === code.toUpperCase());
  if (!coupon) {
    return fail(422, 'COUPON_INVALID', 'This coupon does not exist.', {
      code: 'Invalid coupon code',
    });
  }
  if (Date.parse(coupon.expiresAt) <= now) {
    return fail(422, 'COUPON_EXPIRED', 'This coupon has expired.', {
      code: 'This coupon has expired',
    });
  }
  return ok({ code: coupon.code, basisPoints: coupon.basisPoints });
}

export interface PricedItem {
  unitPriceEth: string;
  quantity: number;
}

export function lineTotal(item: PricedItem): bigint {
  return parseEth(item.unitPriceEth) * BigInt(item.quantity);
}

export function summarize(
  items: readonly PricedItem[],
  coupon: Coupon | null,
  network: Network,
): PriceSummary {
  const subtotal = sumEth(items.map(lineTotal));
  const discount = coupon ? applyBasisPoints(subtotal, coupon.basisPoints) : 0n;
  const networkFee = items.length > 0 ? parseEth(NETWORK_FEES[network]) : 0n;

  return {
    network,
    coupon,
    subtotalEth: formatEth(subtotal),
    discountEth: formatEth(discount),
    networkFeeEth: formatEth(networkFee),
    totalEth: formatEth(subtotal - discount + networkFee),
  };
}
