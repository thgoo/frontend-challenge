import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authSearchSchema } from '@/features/auth/auth-search';
import { AuthLayout } from '@/features/auth/components/auth-layout';
import { LoginForm } from '@/features/auth/components/login-form';
import { safeRedirect } from '@/features/auth/safe-redirect';

export const Route = createFileRoute('/login')({
  validateSearch: authSearchSchema,
  beforeLoad: ({ context, search }) => {
    if (context.session) throw redirect({ href: safeRedirect(search.redirect) });
  },
  head: () => ({ meta: [{ title: 'Sign in · NFT Marketplace' }] }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to buy, favorite and manage your collection."
      footer={
        <>
          New here?{' '}
          <Link
            to="/register"
            search={search}
            className="text-primary underline underline-offset-4"
          >
            Create an account
          </Link>
        </>
      }
    >
      {search.reason === 'expired' && (
        <Alert role="status">
          <AlertDescription>
            Your session expired. Sign in again to continue where you left off.
          </AlertDescription>
        </Alert>
      )}
      <LoginForm
        onSuccess={() => void navigate({ href: safeRedirect(search.redirect), replace: true })}
      />
    </AuthLayout>
  );
}
