import type { DbState } from '../db/types';
import type { MockEvent } from '../realtime/event-bus';

export interface Tx {
  readonly db: DbState;
  readonly now: number;
  emit(event: MockEvent, recipientUserId?: string): void;
}
