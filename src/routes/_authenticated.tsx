import { createFileRoute, redirect } from '@tanstack/react-router';
import { ensureSession } from '@/features/auth/queries';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    const session = await ensureSession(context.queryClient);
    if (!session) throw redirect({ to: '/login', search: { redirect: location.href } });
    return { session };
  },
});
