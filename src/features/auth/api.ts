import { sessionSchema, type LoginInput, type RegisterInput } from '@/contracts/auth';
import { hasErrorCode } from '@/lib/api-error';
import { http, request } from '@/lib/http';

export async function fetchSession(signal?: AbortSignal) {
  try {
    return await request(sessionSchema, { url: '/auth/session', signal });
  } catch (error) {
    if (hasErrorCode(error, 'UNAUTHENTICATED', 'SESSION_EXPIRED')) return null;
    throw error;
  }
}

export function login(input: LoginInput) {
  return request(sessionSchema, { method: 'POST', url: '/auth/login', data: input });
}

export function register(input: RegisterInput) {
  return request(sessionSchema, { method: 'POST', url: '/auth/register', data: input });
}

export async function logout() {
  await http.post('/auth/logout');
}
