import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  walletInputSchema,
  walletProviderSchema,
  type Wallet,
  type WalletInput,
  type WalletRole,
} from '@/contracts/wallet';
import { applyServerErrors } from '@/lib/forms';
import { WALLET_PROVIDER_LABELS } from '@/lib/wallets';
import { useSaveWallet } from '../queries';

const ROLE_TITLES: Record<WalletRole, string> = {
  primary: 'Primary wallet',
  secondary: 'Secondary wallet',
};

export function WalletForm({ role, wallet }: { role: WalletRole; wallet: Wallet | undefined }) {
  const save = useSaveWallet();
  const { register, handleSubmit, setError, control, reset, formState } = useForm<WalletInput>({
    resolver: zodResolver(walletInputSchema),
    defaultValues: wallet ?? { label: '', address: '', provider: 'metamask' },
  });
  const { errors, isDirty } = formState;

  const submit = handleSubmit((input) => {
    save.mutate(
      { role, input },
      {
        onSuccess: () => {
          reset(input);
          toast.success(`${ROLE_TITLES[role]} saved.`);
        },
        onError: (error) => {
          toast.error(applyServerErrors(error, setError));
        },
      },
    );
  });

  return (
    <form
      noValidate
      aria-labelledby={`${role}-wallet-heading`}
      onSubmit={(event) => void submit(event)}
      className="grid content-start gap-4 rounded-2xl bg-card p-6"
    >
      <h2 id={`${role}-wallet-heading`} className="text-xl font-semibold">
        {ROLE_TITLES[role]}
      </h2>
      <FormField label="Label" error={errors.label?.message} {...register('label')} />
      <FormField
        label="Address"
        placeholder="0x…"
        autoComplete="off"
        spellCheck={false}
        className="font-mono"
        error={errors.address?.message}
        {...register('address')}
      />
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Provider</legend>
        <Controller
          control={control}
          name="provider"
          render={({ field }) => (
            <RadioGroup value={field.value} onValueChange={field.onChange} aria-label="Provider">
              {walletProviderSchema.options.map((provider) => (
                <div key={provider} className="flex items-center gap-2">
                  <RadioGroupItem id={`${role}-${provider}`} value={provider} />
                  <Label htmlFor={`${role}-${provider}`}>{WALLET_PROVIDER_LABELS[provider]}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
        />
      </fieldset>
      <Button type="submit" disabled={!isDirty || save.isPending} className="justify-self-start">
        {save.isPending ? 'Saving…' : wallet ? 'Save changes' : 'Add wallet'}
      </Button>
    </form>
  );
}
