import type { Scenario } from '../scenarios';
import { hashPassword } from '../http/password';
import { COUPON_FIXTURES } from './fixtures/coupons';
import { createNftFixtures } from './fixtures/nfts';
import { USER_FIXTURES, WALLET_FIXTURES } from './fixtures/users';
import type { DbState, UserRecord } from './types';

export const DB_SCHEMA_VERSION = 3;
const FIXTURE_SEED = 20_261_029;

export async function createSeed(scenario: Scenario): Promise<DbState> {
  const users = await Promise.all(
    USER_FIXTURES.map(async ({ password, ...user }): Promise<UserRecord> => {
      const passwordSalt = `seed-${user.id}`;
      return { ...user, passwordSalt, passwordHash: await hashPassword(password, passwordSalt) };
    }),
  );

  return {
    schemaVersion: DB_SCHEMA_VERSION,
    sequence: 0,
    users,
    sessions: [],
    nfts: scenario.catalog === 'empty' ? [] : createNftFixtures(FIXTURE_SEED),
    favorites: {},
    carts: [],
    wallets: structuredClone(WALLET_FIXTURES),
    walletConnections: {},
    coupons: structuredClone(COUPON_FIXTURES),
    quotes: [],
    orders: [],
    checkoutDisruptionApplied: false,
  };
}
