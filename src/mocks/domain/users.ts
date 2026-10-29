import type { DbState } from '../db/types';

export function findAccountConflicts(
  db: DbState,
  { email, username }: { email: string; username: string },
  exceptUserId?: string,
): Record<string, string> {
  const others = db.users.filter((user) => user.id !== exceptUserId);
  const conflicts: Record<string, string> = {};
  if (others.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    conflicts.email = 'This email is already registered';
  }
  if (others.some((user) => user.username === username)) {
    conflicts.username = 'This username is already taken';
  }
  return conflicts;
}
