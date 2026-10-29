import type { Session, User } from '@/contracts/auth';
import { mutateDb, readDb } from '../db/store';
import type { UserRecord } from '../db/types';
import { apiError } from './responses';

export const SESSION_COOKIE = 'session';

export function toUser({ passwordHash, passwordSalt, ...user }: UserRecord): User {
  return user;
}

export function createSession(userId: string, ttlMs: number) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  mutateDb((db) => {
    db.sessions.push({ token, userId, expiresAt });
  });
  return { token, expiresAt };
}

export function sessionCookie(token: string, expiresAt: string) {
  return `${SESSION_COOKIE}=${token}; Path=/; SameSite=Lax; Expires=${new Date(expiresAt).toUTCString()}`;
}

export const CLEAR_SESSION_COOKIE = `${SESSION_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;

export function deleteSession(token: string | undefined) {
  if (!token) return;
  mutateDb((db) => {
    db.sessions = db.sessions.filter((session) => session.token !== token);
  });
}

export function toSession(user: UserRecord, expiresAt: string): Session {
  return { user: toUser(user), expiresAt };
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
