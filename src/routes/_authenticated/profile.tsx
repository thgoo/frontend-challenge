import { createFileRoute } from '@tanstack/react-router';
import { ErrorState } from '@/components/query-states';
import { Skeleton } from '@/components/ui/skeleton';
import { AvatarUpload } from '@/features/account/components/avatar-upload';
import { PasswordForm } from '@/features/account/components/password-form';
import { ProfileForm } from '@/features/account/components/profile-form';
import { useProfile } from '@/features/account/queries';
import { SignOutButton } from '@/features/auth/components/sign-out-button';

export const Route = createFileRoute('/_authenticated/profile')({
  head: () => ({ meta: [{ title: 'Profile · NFT Marketplace' }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: user, error, refetch } = useProfile();

  return (
    <div className="mx-auto grid max-w-3xl gap-10 px-4 py-10 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold sm:text-5xl">Profile</h1>
        <SignOutButton />
      </div>
      {error && !user ? (
        <ErrorState
          title="Could not load your profile"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : !user ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <>
          <section aria-labelledby="avatar-heading" className="grid gap-4 rounded-2xl bg-card p-6">
            <h2 id="avatar-heading" className="text-xl font-semibold">
              Avatar
            </h2>
            <AvatarUpload user={user} />
          </section>
          <section aria-labelledby="details-heading" className="grid gap-4 rounded-2xl bg-card p-6">
            <h2 id="details-heading" className="text-xl font-semibold">
              Details
            </h2>
            <ProfileForm key={user.id} user={user} />
          </section>
          <section
            aria-labelledby="password-heading"
            className="grid gap-4 rounded-2xl bg-card p-6"
          >
            <h2 id="password-heading" className="text-xl font-semibold">
              Password
            </h2>
            <PasswordForm />
          </section>
        </>
      )}
    </div>
  );
}
