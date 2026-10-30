import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { couponInputSchema, type Coupon, type CouponInput } from '@/contracts/pricing';
import { errorMessage } from '@/i18n/api-errors';
import { fieldErrorMessage } from '@/i18n/field-errors';
import { applyServerErrors } from '@/lib/forms';
import { useApplyCoupon, useRemoveCoupon } from '../queries';

export function CouponForm({ coupon }: { coupon: Coupon | null }) {
  const id = useId();
  const apply = useApplyCoupon();
  const remove = useRemoveCoupon();
  const { register, handleSubmit, setError, reset, formState } = useForm<CouponInput>({
    resolver: zodResolver(couponInputSchema),
  });
  const error = formState.errors.code?.message;

  if (coupon) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p>
          Cupom <strong className="text-highlight">{coupon.code}</strong> aplicado (
          {coupon.basisPoints / 100}% de desconto)
        </p>
        <button
          type="button"
          disabled={remove.isPending}
          onClick={() => {
            remove.mutate(undefined, {
              onError: (removeError) => toast.error(errorMessage(removeError)),
            });
          }}
          className="text-highlight underline underline-offset-4 disabled:opacity-50"
        >
          Remover cupom
        </button>
      </div>
    );
  }

  const submit = handleSubmit((input) => {
    apply.mutate(input.code, {
      onSuccess: () => {
        reset();
      },
      onError: (applyError) => {
        applyServerErrors(applyError, setError);
      },
    });
  });

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="grid gap-2">
      <label htmlFor={id} className="text-[13px] font-bold">
        Código promocional
      </label>
      <div className="flex rounded-full border border-border lg:rounded-md lg:border-primary">
        <input
          id={id}
          autoComplete="off"
          placeholder="Digite o código promocional..."
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-11 min-w-0 flex-1 rounded-l-full bg-transparent px-4 text-sm uppercase placeholder:text-subtle placeholder:normal-case focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:h-10 lg:rounded-l-md lg:px-3"
          {...register('code')}
        />
        <button
          type="submit"
          disabled={apply.isPending}
          className="rounded-full bg-linear-to-r from-primary to-primary/70 px-5 text-base font-bold text-primary-foreground disabled:opacity-50 lg:rounded-none lg:rounded-r-md lg:bg-primary lg:bg-none"
        >
          Aplicar
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {fieldErrorMessage(error)}
        </p>
      )}
    </form>
  );
}
