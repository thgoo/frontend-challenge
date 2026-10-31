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
        {/* The Figma names this list "Carteira conectada" on mobile. */}
        <h2 id={headingId} className="text-base font-bold lg:text-[17px]">
          <span className="lg:hidden">Carteira conectada</span>
          <span className="max-lg:hidden">Carteira e rede</span>
        </h2>
        <Link
          to="/wallets"
          className="text-sm font-bold text-highlight hover:underline lg:text-[15px]"
        >
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
              className="group flex items-center gap-4 rounded-[15px] border border-transparent bg-card p-4 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[state=checked]:border-primary lg:h-[45px] lg:gap-2.5 lg:rounded-[3px] lg:border-border lg:bg-transparent lg:px-3 lg:py-0"
            >
              <span
                aria-hidden="true"
                className="grid size-4 shrink-0 place-items-center rounded-full border border-primary"
              >
                <span className="size-2 rounded-full bg-primary opacity-0 group-data-[state=checked]:opacity-100" />
              </span>
              {/* Desktop compacts each wallet into one 45px row, as in the Figma. */}
              <span className="grid min-w-0 gap-1 lg:flex lg:items-baseline lg:gap-3">
                <span className="font-bold whitespace-nowrap lg:text-[15px] lg:font-normal">
                  {wallet.label}
                </span>
                <span className="text-sm text-muted-foreground lg:truncate lg:text-[13px]">
                  <span className="font-mono">{shortenAddress(wallet.address)}</span>
                  <span className="max-lg:hidden"> · </span>
                  <span className="max-lg:block">{WALLET_PROVIDER_LABELS[wallet.provider]}</span>
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
