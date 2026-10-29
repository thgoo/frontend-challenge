import { sessionSchema, type LoginInput, type RegisterInput } from '@/contracts/auth';
import { http, request } from '@/lib/http';

/** Answers `null` for guests: having no session is a normal state, not an error. */
export function fetchSession(signal?: AbortSignal) {
  return request(sessionSchema.nullable(), { url: '/auth/session', signal });
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
