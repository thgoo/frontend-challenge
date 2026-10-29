import {
  queryOptions,
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { Session, User } from '@/contracts/auth';
import { sessionKey, userKey } from '@/features/auth/queries';
import { useCurrentUserId } from '@/features/auth/use-current-user-id';
import {
  changePassword,
  fetchProfile,
  fetchWallets,
  saveWallet,
  updateProfile,
  uploadAvatar,
} from './api';

export const profileKey = (userId: string) => [...userKey(userId), 'profile'] as const;
export const walletsKey = (userId: string) => [...userKey(userId), 'wallets'] as const;

export function profileQueryOptions(userId: string | null) {
  return queryOptions({
    queryKey: profileKey(userId ?? 'anonymous'),
    queryFn: userId ? ({ signal }) => fetchProfile(signal) : skipToken,
  });
}

export function walletsQueryOptions(userId: string | null) {
  return queryOptions({
    queryKey: walletsKey(userId ?? 'anonymous'),
    queryFn: userId ? ({ signal }) => fetchWallets(signal) : skipToken,
  });
}

export const useProfile = () => useQuery(profileQueryOptions(useCurrentUserId()));
export const useWallets = () => useQuery(walletsQueryOptions(useCurrentUserId()));

/** The session carries the user too, so the header reflects profile changes without a refetch. */
function useProfileMutation<TInput>(mutationFn: (input: TInput) => Promise<User>) {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  return useMutation({
    mutationFn,
    onSuccess: (user) => {
      if (!userId) return;
      queryClient.setQueryData(profileKey(userId), user);
      queryClient.setQueryData<Session | null>(sessionKey, (session) =>
        session ? { ...session, user } : session,
      );
    },
  });
}

export const useUpdateProfile = () => useProfileMutation(updateProfile);
export const useUploadAvatar = () => useProfileMutation(uploadAvatar);
export const useChangePassword = () => useMutation({ mutationFn: changePassword });

export function useSaveWallet() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  return useMutation({
    mutationFn: saveWallet,
    onSuccess: (wallets) => {
      if (userId) queryClient.setQueryData(walletsKey(userId), wallets);
    },
  });
}
