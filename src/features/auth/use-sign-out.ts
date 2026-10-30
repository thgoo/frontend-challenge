import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { errorMessage } from '@/i18n/api-errors';
import { useLogout } from './queries';

/**
 * Awaits the logout instead of using `mutate` callbacks: a protected page unmounts as soon as the
 * session is cleared, and callbacks of an unmounted observer never run.
 */
export function useSignOut() {
  const logout = useLogout();
  const navigate = useNavigate();
  return {
    pending: logout.isPending,
    signOut: async () => {
      try {
        await logout.mutateAsync();
        await navigate({ to: '/' });
      } catch (error) {
        toast.error(errorMessage(error));
      }
    },
  };
}
