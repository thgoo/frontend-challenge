import { z } from 'zod';

export const AUTH_MODES = ['login', 'register'] as const;
export type AuthMode = (typeof AUTH_MODES)[number];

/** Global search params: `?auth=` opens the sign-in dialog over any page, as in the Figma. */
export const authSearchSchema = z.object({
  auth: z.enum(AUTH_MODES).optional().catch(undefined),
  redirect: z.string().optional().catch(undefined),
  reason: z.enum(['expired']).optional().catch(undefined),
});
export type AuthSearch = z.infer<typeof authSearchSchema>;

export function withAuthDialog(mode: AuthMode) {
  return <T extends object>(search: T) => ({ ...search, auth: mode });
}

export function withoutAuthDialog<T extends AuthSearch>({ auth, redirect, reason, ...search }: T) {
  return search;
}
