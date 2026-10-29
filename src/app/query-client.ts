import { QueryClient } from '@tanstack/react-query';
import { ApiRequestError } from '@/lib/api-error';

const MAX_RETRIES = 2;

/** Only transient failures are retried; 4xx answers will not change by asking again. */
function shouldRetry(failureCount: number, error: unknown) {
  return failureCount < MAX_RETRIES && error instanceof ApiRequestError && error.isTransient;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetry,
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
