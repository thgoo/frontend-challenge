import {
  queryOptions,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { Favorites } from '@/contracts/favorites';
import { userKey } from '@/features/auth/queries';
import { useCurrentUserId } from '@/features/auth/use-current-user-id';
import { fetchFavoriteNfts, fetchFavorites, setFavorite } from './api';

export const favoritesKey = (userId: string) => [...userKey(userId), 'favorites'] as const;

export function favoritesQueryOptions(userId: string | null) {
  return queryOptions({
    queryKey: favoritesKey(userId ?? 'anonymous'),
    queryFn: userId ? ({ signal }) => fetchFavorites(signal) : skipToken,
  });
}

/** Under the favorites key, so every favorite change also refreshes the list. */
export const favoriteNftsKey = (userId: string) => [...favoritesKey(userId), 'nfts'] as const;

export function favoriteNftsQueryOptions(userId: string | null) {
  return queryOptions({
    queryKey: favoriteNftsKey(userId ?? 'anonymous'),
    queryFn: userId ? ({ signal }) => fetchFavoriteNfts(signal) : skipToken,
  });
}

export function useFavorites() {
  return useQuery(favoritesQueryOptions(useCurrentUserId()));
}

/** Optimistic: the heart flips immediately and rolls back if the server rejects the change. */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: ({ nftId, favorite }: { nftId: string; favorite: boolean }) =>
      setFavorite(nftId, favorite),
    onMutate: async ({ nftId, favorite }) => {
      if (!userId) return { previous: undefined };
      const key = favoritesKey(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Favorites>(key);
      const others = (previous?.nftIds ?? []).filter((id) => id !== nftId);
      queryClient.setQueryData<Favorites>(key, { nftIds: favorite ? [...others, nftId] : others });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (userId && context?.previous)
        queryClient.setQueryData(favoritesKey(userId), context.previous);
    },
    onSettled: () => {
      if (userId) void queryClient.invalidateQueries({ queryKey: favoritesKey(userId) });
    },
  });
}
