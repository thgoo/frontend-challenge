import { createFileRoute } from '@tanstack/react-router';
import { ErrorState } from '@/components/query-states';
import { Skeleton } from '@/components/ui/skeleton';
import { walletRoleSchema } from '@/contracts/wallet';
import { AccountLayout } from '@/features/account/components/account-layout';
import { WalletForm } from '@/features/account/components/wallet-form';
import { useWallets } from '@/features/account/queries';

export const Route = createFileRoute('/_authenticated/wallets')({
  head: () => ({ meta: [{ title: 'Carteiras · Kurio' }] }),
  component: WalletsPage,
});

function WalletsPage() {
  const { data: wallets, error, refetch } = useWallets();

  return (
    <AccountLayout>
      <h1 className="sr-only">Carteiras</h1>
      {error && !wallets ? (
        <ErrorState
          title="Não foi possível carregar suas carteiras"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : !wallets ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        walletRoleSchema.options.map((role) => (
          <WalletForm
            key={role}
            role={role}
            wallet={wallets.find((wallet) => wallet.role === role)}
          />
        ))
      )}
    </AccountLayout>
  );
}
