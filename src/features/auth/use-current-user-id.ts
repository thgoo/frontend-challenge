import { useSession } from './queries';

export function useCurrentUserId(): string | null {
  return useSession()?.user.id ?? null;
}
