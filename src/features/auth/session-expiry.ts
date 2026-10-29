import type { QueryClient } from '@tanstack/react-query';
import type { RegisteredRouter } from '@tanstack/react-router';
import { onUnauthorized } from '@/lib/http';
import { replaceSession, sessionKey } from './queries';

/** A 401 while signed in means the session was lost: drop private data and resume after login. */
export function watchSessionExpiry(queryClient: QueryClient, router: RegisteredRouter) {
  return onUnauthorized(() => {
    if (!queryClient.getQueryData(sessionKey)) return;
    replaceSession(queryClient, null);
    void router.navigate({
      to: '/login',
      search: { redirect: router.state.location.href, reason: 'expired' },
    });
  });
}
