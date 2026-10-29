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
  if (!state) throw new Error('Mock database used before initDb()');
  return state;
}

/** Every write goes through here so persistence cannot be forgotten. */
export function mutateDb<T>(change: (db: DbState) => T): T {
  if (!state) throw new Error('Mock database used before initDb()');
  const result = change(state);
  persist();
  return result;
}

export function nextId(db: DbState, prefix: string): string {
  db.sequence += 1;
  return `${prefix}_${String(db.sequence).padStart(4, '0')}`;
}
