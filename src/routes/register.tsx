import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { authSearchSchema } from '@/features/auth/auth-search';
import { AuthLayout } from '@/features/auth/components/auth-layout';
import { RegisterForm } from '@/features/auth/components/register-form';
import { safeRedirect } from '@/features/auth/safe-redirect';

export const Route = createFileRoute('/register')({
  validateSearch: authSearchSchema,
  beforeLoad: ({ context, search }) => {
    if (context.session) throw redirect({ href: safeRedirect(search.redirect) });
  },
  head: () => ({ meta: [{ title: 'Create account · NFT Marketplace' }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Create account"
      subtitle="Start collecting in a few seconds."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" search={search} className="text-primary underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm
        onSuccess={() => void navigate({ href: safeRedirect(search.redirect), replace: true })}
      />
    </AuthLayout>
  );
}
