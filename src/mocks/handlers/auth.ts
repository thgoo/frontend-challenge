import { http, HttpResponse } from 'msw';
import { loginInputSchema, registerInputSchema } from '@/contracts/auth';
import { currentScenario } from '../runtime';
import { mutateDb, nextId, readDb } from '../db/store';
import type { UserRecord } from '../db/types';
import { apiPath } from '../http/api';
import { createSalt, hashPassword, verifyPassword } from '../http/password';
import { apiError, readJson, validationError } from '../http/responses';
import {
  authenticate,
  CLEAR_SESSION_COOKIE,
  createSession,
  deleteSession,
  SESSION_COOKIE,
  sessionCookie,
  toSession,
} from '../http/session';

function startSession(user: UserRecord, status: number) {
  const { token, expiresAt } = createSession(user.id, currentScenario().sessionTtlMs);
  return HttpResponse.json(toSession(user, expiresAt), {
    status,
    headers: { 'Set-Cookie': sessionCookie(token, expiresAt) },
  });
}

function findConflicts(email: string, username: string) {
  const conflicts: Record<string, string> = {};
  const { users } = readDb();
  if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    conflicts.email = 'This email is already registered';
  }
  if (users.some((user) => user.username === username)) {
    conflicts.username = 'This username is already taken';
  }
  return conflicts;
}

export const authHandlers = [
  http.post(apiPath('/auth/register'), async ({ request }) => {
    const input = await readJson(request, registerInputSchema);
    if (!input.success) return validationError(input.error);

    const { name, username, email, password } = input.data;
    const conflicts = findConflicts(email, username);
    if (Object.keys(conflicts).length > 0) {
      return apiError(409, 'CONFLICT', 'An account with these details already exists.', conflicts);
    }

    const passwordSalt = createSalt();
    const passwordHash = await hashPassword(password, passwordSalt);
    const user = mutateDb((db) => {
      const record: UserRecord = {
        id: nextId(db, 'usr'),
        name,
        username,
        email,
        bio: '',
        avatarUrl: null,
        passwordSalt,
        passwordHash,
      };
      db.users.push(record);
      db.wallets[record.id] = [];
      return record;
    });
    return startSession(user, 201);
  }),

  http.post(apiPath('/auth/login'), async ({ request }) => {
    const input = await readJson(request, loginInputSchema);
    if (!input.success) return validationError(input.error);

    const { email, password } = input.data;
    const user = readDb().users.find(
      (candidate) => candidate.email.toLowerCase() === email.toLowerCase(),
    );
    const valid = user && (await verifyPassword(password, user.passwordSalt, user.passwordHash));
    if (!user || !valid) return apiError(401, 'UNAUTHENTICATED', 'Invalid email or password.');
    return startSession(user, 200);
  }),

  http.get(apiPath('/auth/session'), ({ cookies }) => {
    const auth = authenticate(cookies);
    if (!auth.ok) return auth.response;
    return HttpResponse.json(toSession(auth.user, auth.expiresAt));
  }),

  http.post(apiPath('/auth/logout'), ({ cookies }) => {
    deleteSession(cookies[SESSION_COOKIE]);
    return new HttpResponse(null, { status: 204, headers: { 'Set-Cookie': CLEAR_SESSION_COOKIE } });
  }),
];
