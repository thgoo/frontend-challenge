import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { networkSchema, type Wallet } from '@/contracts/wallet';
import { useSession } from '@/features/auth/queries';
import { NETWORK_LABELS } from '@/lib/networks';
import { shortenAddress, WALLET_PROVIDER_LABELS } from '@/lib/wallets';
import { checkoutDetailsSchema, checkoutDraft, type CheckoutDetails } from '../checkout-details';
import { useIsWalletConnected } from '../queries';
import { WalletConnectionStatus } from './wallet-connection-status';

interface DetailsFormProps {
  wallets: Wallet[];
  submitting: boolean;
  onSubmit: (details: CheckoutDetails) => void;
}

export function DetailsForm({ wallets, submitting, onSubmit }: DetailsFormProps) {
  const session = useSession();
  const primary = wallets.find((wallet) => wallet.role === 'primary') ?? wallets[0];
  const { register, handleSubmit, control, formState } = useForm<CheckoutDetails>({
    resolver: zodResolver(checkoutDetailsSchema),
    defaultValues: {
      fullName: session?.user.name ?? '',
      email: session?.user.email ?? '',
      country: '',
      walletId: primary?.id ?? '',
      network: 'ethereum',
      ...checkoutDraft.read(),
    },
  });
  const { errors } = formState;
  const [walletId, network] = useWatch({ control, name: ['walletId', 'network'] });
  const connected = useIsWalletConnected(walletId, network);
  const [showConnectionError, setShowConnectionError] = useState(false);

  const values = useWatch({ control });
  useEffect(() => {
    checkoutDraft.write(values);
  }, [values]);

  const submit = handleSubmit((details) => {
    setShowConnectionError(!connected);
    if (connected) onSubmit(details);
  });

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="grid gap-8">
      <fieldset className="grid gap-4">
        <legend className="mb-2 text-xl font-semibold">Collector details</legend>
        <FormField
          label="Full name"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <FormField
          label="Country"
          autoComplete="country-name"
          error={errors.country?.message}
          {...register('country')}
        />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-xl font-semibold">Wallet</legend>
        {wallets.length === 0 ? (
          <Alert>
            <AlertDescription>
              You have no wallets yet.{' '}
              <Link to="/wallets" className="text-primary underline">
                Add a wallet
              </Link>{' '}
              to continue.
            </AlertDescription>
          </Alert>
        ) : (
          <Controller
            control={control}
            name="walletId"
            render={({ field }) => (
              <RadioGroup aria-label="Wallet" value={field.value} onValueChange={field.onChange}>
                {wallets.map((wallet) => (
                  <div key={wallet.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <RadioGroupItem id={`wallet-${wallet.id}`} value={wallet.id} />
                    <Label htmlFor={`wallet-${wallet.id}`} className="grid gap-1">
                      <span>
                        {wallet.label} · {WALLET_PROVIDER_LABELS[wallet.provider]}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {shortenAddress(wallet.address)} · {wallet.role}
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />
        )}
        {errors.walletId && <p className="text-sm text-destructive">{errors.walletId.message}</p>}
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-xl font-semibold">Network</legend>
        <Controller
          control={control}
          name="network"
          render={({ field }) => (
            <RadioGroup
              aria-label="Network"
              value={field.value}
              onValueChange={field.onChange}
              className="grid-cols-2 sm:grid-cols-4"
            >
              {networkSchema.options.map((option) => (
                <div key={option} className="flex items-center gap-2 rounded-lg border p-3">
                  <RadioGroupItem id={`network-${option}`} value={option} />
                  <Label htmlFor={`network-${option}`}>{NETWORK_LABELS[option]}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
        />
        <WalletConnectionStatus
          wallet={wallets.find((wallet) => wallet.id === walletId)}
          network={network}
        />
        {showConnectionError && !connected && (
          <p role="alert" className="text-sm text-destructive">
            Connect the selected wallet on {NETWORK_LABELS[network]} to continue.
          </p>
        )}
      </fieldset>

      <Button type="submit" size="lg" disabled={submitting || wallets.length === 0}>
        {submitting ? 'Preparing review…' : 'Review order'}
      </Button>
    </form>
  );
}
