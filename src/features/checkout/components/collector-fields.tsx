import { Controller, type UseFormReturn } from 'react-hook-form';
import { Field, FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { networkSchema } from '@/contracts/wallet';
import { NETWORK_LABELS } from '@/lib/networks';
import type { CheckoutDetails } from '../checkout-details';

interface CollectorFieldsProps {
  form: UseFormReturn<CheckoutDetails>;
  username: string | undefined;
  walletAddress: string | undefined;
}

/** Buyer details; username and wallet address are read-only context for the order. */
export function CollectorFields({ form, username, walletAddress }: CollectorFieldsProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-x-6">
      <FormField
        label="Nome de exibição"
        required
        autoComplete="name"
        error={errors.fullName?.message}
        {...register('fullName')}
      />
      <Field label="Nome de usuário">
        {(fieldControl) => (
          <Input {...fieldControl} readOnly value={username ? `@${username}` : ''} />
        )}
      </Field>
      <Controller
        control={control}
        name="network"
        render={({ field }) => (
          <Field label="Rede" required>
            {(fieldControl) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(networkSchema.parse(value));
                }}
              >
                <SelectTrigger {...fieldControl} className="h-10 w-full rounded-sm border-border">
                  <SelectValue placeholder="Selecione uma rede" />
                </SelectTrigger>
                <SelectContent>
                  {networkSchema.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {NETWORK_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
        )}
      />
      <FormField
        label="E-mail"
        required
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Field label="Endereço da carteira">
        {(fieldControl) => (
          <Input {...fieldControl} readOnly value={walletAddress ?? ''} className="font-mono" />
        )}
      </Field>
      <div className="sm:col-span-2 sm:max-w-[350px]">
        <Field label="Observação do colecionador (opcional)" error={errors.note?.message}>
          {(fieldControl) => <Textarea {...fieldControl} rows={5} {...register('note')} />}
        </Field>
      </div>
    </div>
  );
}
