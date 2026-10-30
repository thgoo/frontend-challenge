import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { authSearchSchema } from '@/features/auth/auth-search';
import { AuthCard } from '@/features/auth/components/auth-card';
import { RegisterForm } from '@/features/auth/components/register-form';
import { safeRedirect } from '@/features/auth/safe-redirect';

export const Route = createFileRoute('/register')({
  validateSearch: authSearchSchema,
  staticData: { hideMobileTabBar: true },
  beforeLoad: ({ context, search }) => {
    if (context.session) throw redirect({ href: safeRedirect(search.redirect) });
  },
  head: () => ({ meta: [{ title: 'Criar conta · Kurio' }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  return (
    <AuthCard
      mode="register"
      search={search}
      subtitle="Crie seu perfil de colecionador e conecte uma carteira quando quiser."
    >
      <RegisterForm
        onSuccess={() => void navigate({ href: safeRedirect(search.redirect), replace: true })}
      />
    </AuthCard>
  );
}
