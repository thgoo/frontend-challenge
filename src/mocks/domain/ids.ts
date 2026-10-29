import type { DbState } from '../db/types';

export function nextId(db: DbState, prefix: string): string {
  db.sequence += 1;
  return `${prefix}_${String(db.sequence).padStart(4, '0')}`;
}
