import type { CartItemInput } from '@/contracts/cart';
import type { Nft } from '@/contracts/nft';
import type { Order, OrderStatus } from '@/contracts/order';
import type { Quote } from '@/contracts/quote';
import type { User } from '@/contracts/auth';
import type { Wallet } from '@/contracts/wallet';

export interface UserRecord extends User {
  passwordHash: string;
  passwordSalt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  expiresAt: string;
}

export interface CartRecord {
  id: string;
  userId: string | null;
  items: CartItemInput[];
  couponCode: string | null;
  version: number;
}

export interface CouponRecord {
  code: string;
  basisPoints: number;
  expiresAt: string;
}

export interface QuoteRecord extends Quote {
  userId: string;
}

export interface OrderRecord extends Order {
  userId: string;
  quoteId: string;
  idempotencyKey: string;
  requestFingerprint: string;
  settlesAt: string;
  plannedOutcome: Exclude<OrderStatus, 'pending'>;
}

export interface DbState {
  schemaVersion: number;
  sequence: number;
  users: UserRecord[];
  sessions: SessionRecord[];
  nfts: Nft[];
  favorites: Record<string, string[]>;
  carts: CartRecord[];
  wallets: Record<string, Wallet[]>;
  coupons: CouponRecord[];
  quotes: QuoteRecord[];
  orders: OrderRecord[];
  checkoutDisruptionApplied: boolean;
}
