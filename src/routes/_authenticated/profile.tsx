import { createFileRoute } from '@tanstack/react-router';
import { ErrorState } from '@/components/query-states';
import { Skeleton } from '@/components/ui/skeleton';
import { AccountLayout } from '@/features/account/components/account-layout';
import { AvatarUpload } from '@/features/account/components/avatar-upload';
import { PasswordForm } from '@/features/account/components/password-form';
import { ProfileForm } from '@/features/account/components/profile-form';
import { useProfile } from '@/features/account/queries';

export const Route = createFileRoute('/_authenticated/profile')({
  head: () => ({ meta: [{ title: 'Perfil · Kurio' }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: user, error, refetch } = useProfile();

  return (
    <AccountLayout>
      <h1 className="text-base font-bold">Perfil do colecionador</h1>
      {error && !user ? (
        <ErrorState
          title="Não foi possível carregar seu perfil"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : !user ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <section aria-label="Dados do perfil" className="grid gap-6">
            <AvatarUpload user={user} />
            <ProfileForm key={user.id} user={user} />
          </section>
          <section aria-labelledby="password-heading" className="grid gap-6">
            <h2 id="password-heading" className="text-base font-medium">
              Alterar senha
            </h2>
            <PasswordForm />
          </section>
        </>
      )}
    </AccountLayout>
  );
}
