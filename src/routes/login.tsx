import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authSearchSchema } from '@/features/auth/auth-search';
import { AuthCard } from '@/features/auth/components/auth-card';
import { LoginForm } from '@/features/auth/components/login-form';
import { safeRedirect } from '@/features/auth/safe-redirect';

export const Route = createFileRoute('/login')({
  validateSearch: authSearchSchema,
  staticData: { hideMobileTabBar: true },
  beforeLoad: ({ context, search }) => {
    if (context.session) throw redirect({ href: safeRedirect(search.redirect) });
  },
  head: () => ({ meta: [{ title: 'Entrar · Kurio' }] }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  return (
    <AuthCard
      mode="login"
      search={search}
      subtitle="Entre para gerenciar sua carteira, coleção e perfil de criador."
      notice={
        search.reason === 'expired' && (
          <Alert role="status">
            <AlertDescription>
              Sua sessão expirou. Entre novamente para continuar de onde parou.
            </AlertDescription>
          </Alert>
        )
      }
    >
      <LoginForm
        onSuccess={() => void navigate({ href: safeRedirect(search.redirect), replace: true })}
      />
    </AuthCard>
  );
}
