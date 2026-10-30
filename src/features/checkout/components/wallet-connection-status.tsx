import { CheckCircle2, PlugZap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { Network, Wallet } from '@/contracts/wallet';
import { errorMessage } from '@/i18n/api-errors';
import { NETWORK_LABELS } from '@/lib/networks';
import { useConnectWallet, useDisconnectWallet, useIsWalletConnected } from '../queries';

export function WalletConnectionStatus({
  wallet,
  network,
}: {
  wallet: Wallet | undefined;
  network: Network;
}) {
  const connect = useConnectWallet();
  const disconnect = useDisconnectWallet();
  const connected = useIsWalletConnected(wallet?.id ?? '', network);
  if (!wallet) return null;

  return (
    <div className="grid gap-3 rounded-lg border p-4" aria-live="polite">
      {connected ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2">
            <CheckCircle2 aria-hidden="true" className="size-5 text-emerald-400" />
            Connected to {wallet.label} on {NETWORK_LABELS[network]}
          </p>
          <Button
            type="button"
            variant="ghost"
            disabled={disconnect.isPending}
            onClick={() => {
              disconnect.mutate();
            }}
          >
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-muted-foreground">
            <PlugZap aria-hidden="true" className="size-5" />
            Wallet not connected
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={connect.isPending}
            onClick={() => {
              connect.mutate({ walletId: wallet.id, network });
            }}
          >
            {connect.isPending ? 'Waiting for wallet…' : `Connect ${wallet.label}`}
          </Button>
        </div>
      )}
      {connect.isError && !connected && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(connect.error)}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
