import { http, HttpResponse } from 'msw';
import { loginInputSchema, registerInputSchema } from '@/contracts/auth';
import { currentScenario } from '../runtime';
import { readDb, transaction } from '../db/store';
import { mergeGuestCart } from '../domain/carts';
import { nextId } from '../domain/ids';
import { findAccountConflicts } from '../domain/users';
import type { UserRecord } from '../db/types';
import { apiPath } from '../http/api';
import { createSalt, hashPassword, verifyPassword } from '../http/password';
import { apiError, readJson, validationError } from '../http/responses';
import {
  CLEAR_SESSION_COOKIE,
  GUEST_CART_COOKIE,
  SESSION_COOKIE,
  sessionCookie,
} from '../http/cookies';
import { authenticate, createSession, deleteSession, toSession } from '../http/session';

function startSession(user: UserRecord, status: number, cookies: Record<string, string>) {
  const { token, expiresAt } = createSession(user.id, currentScenario().sessionTtlMs);
  transaction((tx) => {
    mergeGuestCart(tx, cookies[GUEST_CART_COOKIE], user.id);
  });
  return HttpResponse.json(toSession(user, expiresAt), {
    status,
    headers: { 'Set-Cookie': sessionCookie(token, expiresAt) },
  });
}

export const authHandlers = [
  http.post(apiPath('/auth/register'), async ({ request, cookies }) => {
    const input = await readJson(request, registerInputSchema);
    if (!input.success) return validationError(input.error);

    const { name, username, email, password } = input.data;
    const conflicts = findAccountConflicts(readDb(), { email, username });
    if (Object.keys(conflicts).length > 0) {
      return apiError(409, 'CONFLICT', 'An account with these details already exists.', conflicts);
    }

    const passwordSalt = createSalt();
    const passwordHash = await hashPassword(password, passwordSalt);
    const user = transaction(({ db }) => {
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
    return startSession(user, 201, cookies);
  }),

  http.post(apiPath('/auth/login'), async ({ request, cookies }) => {
    const input = await readJson(request, loginInputSchema);
    if (!input.success) return validationError(input.error);

    const { email, password } = input.data;
    const user = readDb().users.find(
      (candidate) => candidate.email.toLowerCase() === email.toLowerCase(),
    );
    const valid = user && (await verifyPassword(password, user.passwordSalt, user.passwordHash));
    if (!user || !valid) return apiError(401, 'UNAUTHENTICATED', 'Invalid email or password.');
    return startSession(user, 200, cookies);
  }),

  http.get(apiPath('/auth/session'), ({ cookies }) => {
    const auth = authenticate(cookies);
    return HttpResponse.json(auth.ok ? toSession(auth.user, auth.expiresAt) : null);
  }),

  http.post(apiPath('/auth/logout'), ({ cookies }) => {
    deleteSession(cookies[SESSION_COOKIE]);
    return new HttpResponse(null, { status: 204, headers: { 'Set-Cookie': CLEAR_SESSION_COOKIE } });
  }),
];
