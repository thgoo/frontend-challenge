import type { Session, User } from '@/contracts/auth';
import { readDb, transaction } from '../db/store';
import type { UserRecord } from '../db/types';
import { SESSION_COOKIE } from './cookies';
import { apiError } from './responses';

export function toUser({ passwordHash, passwordSalt, ...user }: UserRecord): User {
  return user;
}

export function createSession(userId: string, ttlMs: number) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  transaction(({ db }) => {
    db.sessions.push({ token, userId, expiresAt });
  });
  return { token, expiresAt };
}

export function deleteSession(token: string | undefined) {
  if (!token) return;
  transaction(({ db }) => {
    db.sessions = db.sessions.filter((session) => session.token !== token);
  });
}

export function toSession(user: UserRecord, expiresAt: string): Session {
  return { user: toUser(user), expiresAt };
}

export function currentUser(cookies: Record<string, string>): UserRecord | null {
  const auth = authenticate(cookies);
  return auth.ok ? auth.user : null;
}

type AuthResult =
  | { ok: true; user: UserRecord; expiresAt: string }
  | { ok: false; response: ReturnType<typeof apiError> };

export function authenticate(cookies: Record<string, string>): AuthResult {
  const token = cookies[SESSION_COOKIE];
  const session = readDb().sessions.find((candidate) => candidate.token === token);
  if (!token || !session) {
    return { ok: false, response: apiError(401, 'UNAUTHENTICATED', 'Sign in to continue.') };
  }
  if (Date.parse(session.expiresAt) <= Date.now()) {
    deleteSession(token);
    return { ok: false, response: apiError(401, 'SESSION_EXPIRED', 'Your session has expired.') };
  }
  const user = readDb().users.find((candidate) => candidate.id === session.userId);
  if (!user)
    return { ok: false, response: apiError(401, 'UNAUTHENTICATED', 'Sign in to continue.') };
  return { ok: true, user, expiresAt: session.expiresAt };
}
