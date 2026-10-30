import type { DbState } from '../db/types';
import { FIELD_ERRORS } from '@/contracts/field-errors';

export function findAccountConflicts(
  db: DbState,
  { email, username }: { email: string; username: string },
  exceptUserId?: string,
): Record<string, string> {
  const others = db.users.filter((user) => user.id !== exceptUserId);
  const conflicts: Record<string, string> = {};
  if (others.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    conflicts.email = FIELD_ERRORS.emailTaken;
  }
  if (others.some((user) => user.username === username)) {
    conflicts.username = FIELD_ERRORS.usernameTaken;
  }
  return conflicts;
}
