import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Field, FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const ROLE_COPY: Record<WalletRole, { title: string; description: string }> = {
  primary: {
    title: 'Carteira principal',
    description: 'Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.',
  },
  secondary: {
    title: 'Carteira secundária',
    description: 'Uma alternativa para pagar ou receber em outra carteira.',
  },
};

export function WalletForm({ role, wallet }: { role: WalletRole; wallet: Wallet | undefined }) {
  const save = useSaveWallet();
  const copy = ROLE_COPY[role];
  const headingId = `${role}-wallet-heading`;
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
          toast.success(`${copy.title} salva.`);
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
      aria-labelledby={headingId}
      onSubmit={(event) => void submit(event)}
      className="grid content-start gap-6"
    >
      <header className="grid gap-1">
        <h2 id={headingId} className="text-[17px] font-bold">
          {copy.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {wallet ? copy.description : 'Você ainda não adicionou esta carteira.'}
        </p>
      </header>
      <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
        <FormField
          label="Apelido da carteira"
          required
          error={errors.label?.message}
          {...register('label')}
        />
        <FormField
          label="Endereço da carteira"
          required
          placeholder="Endereço 0x da carteira"
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
          error={errors.address?.message}
          {...register('address')}
        />
        <Controller
          control={control}
          name="provider"
          render={({ field }) => (
            <Field label="Tipo de carteira" required>
              {(fieldControl) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(walletProviderSchema.parse(value));
                  }}
                >
                  <SelectTrigger
                    {...fieldControl}
                    className="h-10 w-full rounded-sm border-border"
                  >
                    <SelectValue placeholder="Selecione uma carteira" />
                  </SelectTrigger>
                  <SelectContent>
                    {walletProviderSchema.options.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {WALLET_PROVIDER_LABELS[provider]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
          )}
        />
      </div>
      <Button
        type="submit"
        disabled={!isDirty || save.isPending}
        className="h-10 w-[152px] justify-self-start rounded-[3px] font-bold"
      >
        {save.isPending ? 'Salvando…' : 'Salvar carteira'}
      </Button>
    </form>
  );
}
