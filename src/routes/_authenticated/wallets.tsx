import { createFileRoute } from '@tanstack/react-router';
import { ErrorState } from '@/components/query-states';
import { Skeleton } from '@/components/ui/skeleton';
import { walletRoleSchema } from '@/contracts/wallet';
import { WalletForm } from '@/features/account/components/wallet-form';
import { useWallets } from '@/features/account/queries';

export const Route = createFileRoute('/_authenticated/wallets')({
  head: () => ({ meta: [{ title: 'Wallets · NFT Marketplace' }] }),
  component: WalletsPage,
});

function WalletsPage() {
  const { data: wallets, error, refetch } = useWallets();

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-8">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold sm:text-5xl">Wallets</h1>
        <p className="text-muted-foreground">
          Register the wallets you pay with. The primary one is selected by default at checkout.
        </p>
      </header>
      {error && !wallets ? (
        <ErrorState
          title="Could not load your wallets"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : !wallets ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {walletRoleSchema.options.map((role) => (
            <WalletForm
              key={role}
              role={role}
              wallet={wallets.find((wallet) => wallet.role === role)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
