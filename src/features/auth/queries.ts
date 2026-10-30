import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
  type QueryClient,
} from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import type { Session } from '@/contracts/auth';
import { fetchSession, login, logout, register } from './api';

export const sessionKey = ['session'] as const;

/** Private data lives under these roots, so a session change can drop it in one call. */
export const PRIVATE_QUERY_ROOTS = [['user'], ['guest']] as const;

export const sessionQueryOptions = queryOptions({
  queryKey: sessionKey,
  queryFn: ({ signal }) => fetchSession(signal),
  staleTime: Infinity,
});

/** Resolves the session once per page load; later reads come from the cache. */
export function ensureSession(queryClient: QueryClient) {
  return queryClient.query({ ...sessionQueryOptions, staleTime: 'static' });
}

export function userKey(userId: string) {
  return ['user', userId] as const;
}

export function clearPrivateData(queryClient: QueryClient) {
  for (const queryKey of PRIVATE_QUERY_ROOTS) {
    void queryClient.cancelQueries({ queryKey });
    queryClient.removeQueries({ queryKey });
  }
}

export function replaceSession(queryClient: QueryClient, session: Session | null) {
  clearPrivateData(queryClient);
  queryClient.setQueryData(sessionKey, session);
}

export function useSession() {
  return useSuspenseQuery(sessionQueryOptions).data;
}

function useSessionTransition<TInput>(mutationFn: (input: TInput) => Promise<Session | null>) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn,
    onSuccess: async (session) => {
      replaceSession(queryClient, session);
      await router.invalidate();
    },
  });
}

export function useLogin() {
  return useSessionTransition(login);
}

export function useRegister() {
  return useSessionTransition(register);
}

export function useLogout() {
  return useSessionTransition(async () => {
    await logout();
    return null;
  });
}
