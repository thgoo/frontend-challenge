import { Link } from '@tanstack/react-router';
import { RadioGroup } from 'radix-ui';
import { useId } from 'react';
import type { Wallet } from '@/contracts/wallet';
import { fieldErrorMessage } from '@/i18n/field-errors';
import { shortenAddress, WALLET_PROVIDER_LABELS } from '@/lib/wallets';

interface WalletPickerProps {
  wallets: readonly Wallet[];
  value: string;
  onChange: (walletId: string) => void;
  error?: string;
}

export function WalletPicker({ wallets, value, onChange, error }: WalletPickerProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="grid gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 id={headingId} className="text-[17px] font-bold">
          Carteira e rede
        </h2>
        <Link to="/wallets" className="text-[15px] font-bold text-highlight hover:underline">
          Trocar carteira
        </Link>
      </div>
      {wallets.length === 0 ? (
        <p className="rounded-lg bg-card p-4 text-sm">
          Você ainda não tem carteiras.{' '}
          <Link to="/wallets" className="text-highlight underline">
            Adicione uma carteira
          </Link>{' '}
          para continuar.
        </p>
      ) : (
        <RadioGroup.Root
          aria-labelledby={headingId}
          value={value}
          onValueChange={onChange}
          className="grid gap-3"
        >
          {wallets.map((wallet) => (
            <RadioGroup.Item
              key={wallet.id}
              value={wallet.id}
              className="group flex items-center gap-4 rounded-xl border border-transparent bg-card p-4 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[state=checked]:border-primary"
            >
              <span
                aria-hidden="true"
                className="grid size-4 shrink-0 place-items-center rounded-full border border-primary"
              >
                <span className="size-2 rounded-full bg-primary opacity-0 group-data-[state=checked]:opacity-100" />
              </span>
              <span className="grid gap-1">
                <span className="font-bold">{wallet.label}</span>
                <span className="font-mono text-sm text-muted-foreground">
                  {shortenAddress(wallet.address)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {WALLET_PROVIDER_LABELS[wallet.provider]}
                </span>
              </span>
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>
      )}
      {error && <p className="text-sm text-destructive">{fieldErrorMessage(error)}</p>}
    </section>
  );
}
