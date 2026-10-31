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
    <form noValidate onSubmit={(event) => void submit(event)} className="grid grid-cols-1 gap-2">
      <label htmlFor={id} className="text-sm leading-4 font-bold max-lg:sr-only">
        Código promocional
      </label>
      <div className="flex h-[50px] rounded-full border border-border bg-card shadow-[0_0_20px_rgb(10_6_4/0.45)] lg:h-10 lg:rounded-[3px] lg:border-primary lg:bg-transparent lg:shadow-none">
        <input
          id={id}
          autoComplete="off"
          placeholder="Digite o código promocional..."
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="min-w-0 flex-1 rounded-l-full bg-transparent px-4 text-[13px] uppercase placeholder:text-subtle placeholder:normal-case focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:rounded-l-[3px] lg:px-2 lg:text-xs"
          {...register('code')}
        />
        <button
          type="submit"
          disabled={apply.isPending}
          className="w-[97px] shrink-0 rounded-full bg-linear-to-r from-primary/54 to-primary text-[15px] font-bold text-foreground disabled:opacity-50 lg:w-[102px] lg:rounded-none lg:rounded-r-[3px] lg:bg-primary lg:bg-none lg:text-primary-foreground"
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
