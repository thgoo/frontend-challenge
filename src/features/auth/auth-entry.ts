import type { QueryClient } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';
import type { AuthMode, AuthSearch } from './auth-search';
import { ensureSession } from './queries';
import { safeRedirect } from './safe-redirect';

/** Signed-in visitors go straight to their destination; guests get the dialog over the home page. */
export async function redirectToAuthDialog(
  queryClient: QueryClient,
  search: AuthSearch,
  mode: AuthMode,
): Promise<never> {
  const session = await ensureSession(queryClient);
  if (session) throw redirect({ href: safeRedirect(search.redirect), replace: true });
  throw redirect({ to: '/', search: { ...search, auth: mode }, replace: true });
}
