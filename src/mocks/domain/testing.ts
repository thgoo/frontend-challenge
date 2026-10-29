import { createSeed } from '../db/seed';
import type { DbState } from '../db/types';
import type { Delivery } from '../realtime/event-bus';
import { defaultScenario } from '../scenarios';
import type { Tx } from './tx';

export const NOW = Date.parse('2026-10-29T12:00:00.000Z');

export async function createTestTx(now = NOW): Promise<Tx & { db: DbState; events: Delivery[] }> {
  const db = await createSeed(defaultScenario);
  const events: Delivery[] = [];
  return {
    db,
    now,
    events,
    emit: (event, recipientUserId) =>
      events.push({ event, recipientUserId: recipientUserId ?? null }),
  };
}
