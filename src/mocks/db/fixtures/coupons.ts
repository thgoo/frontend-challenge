import type { CouponRecord } from '../types';

export const COUPON_FIXTURES: CouponRecord[] = [
  { code: 'WELCOME10', basisPoints: 1000, expiresAt: '2099-12-31T23:59:59.000Z' },
  { code: 'COLLECTOR25', basisPoints: 2500, expiresAt: '2099-12-31T23:59:59.000Z' },
  { code: 'SUMMER20', basisPoints: 2000, expiresAt: '2020-09-01T00:00:00.000Z' },
];
