import type { Tx } from '../domain/tx';
import { publish, type Delivery } from '../realtime/event-bus';
import type { Scenario } from '../scenarios';
import { createSeed, DB_SCHEMA_VERSION } from './seed';
import type { DbState } from './types';

const STORAGE_KEY = 'nft-mocks:db';
let state: DbState | null = null;

function load(): DbState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DbState;
    return parsed.schemaVersion === DB_SCHEMA_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

function requireState(): DbState {
  if (!state) throw new Error('Mock database used before initDb()');
  return state;
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function initDb(scenario: Scenario) {
  state = load() ?? (await createSeed(scenario));
  persist();
}

export async function resetDb(scenario: Scenario) {
  state = await createSeed(scenario);
  persist();
}

export function readDb(): Readonly<DbState> {
  return requireState();
}

/** Events queued during the change are published only after the new state is persisted. */
export function transaction<T>(change: (tx: Tx) => T): T {
  const outbox: Delivery[] = [];
  const result = change({
    db: requireState(),
    now: Date.now(),
    emit: (event, recipientUserId) =>
      outbox.push({ event, recipientUserId: recipientUserId ?? null }),
  });
  persist();
  outbox.forEach(publish);
  return result;
}
