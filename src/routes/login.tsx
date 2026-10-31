import { createFileRoute } from '@tanstack/react-router';
import { redirectToAuthDialog } from '@/features/auth/auth-entry';

/** Deep link kept for bookmarks and old links: sign-in is a dialog over the home page. */
export const Route = createFileRoute('/login')({
  beforeLoad: ({ context, search }) => redirectToAuthDialog(context.queryClient, search, 'login'),
});
