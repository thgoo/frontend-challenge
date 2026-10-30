import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormField } from '@/components/form-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { couponInputSchema, type Coupon, type CouponInput } from '@/contracts/pricing';
import { errorMessage } from '@/i18n/api-errors';
import { applyServerErrors } from '@/lib/forms';
import { useApplyCoupon, useRemoveCoupon } from '../queries';

export function CouponForm({ coupon }: { coupon: Coupon | null }) {
  const apply = useApplyCoupon();
  const remove = useRemoveCoupon();
  const { register, handleSubmit, setError, reset, formState } = useForm<CouponInput>({
    resolver: zodResolver(couponInputSchema),
  });

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm">
          Coupon <Badge variant="secondary">{coupon.code}</Badge> applied (
          {coupon.basisPoints / 100}% off)
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={remove.isPending}
          onClick={() => {
            remove.mutate(undefined, {
              onError: (error) => {
                toast.error(errorMessage(error));
              },
            });
          }}
        >
          Remove
        </Button>
      </div>
    );
  }

  const submit = handleSubmit((input) => {
    apply.mutate(input.code, {
      onSuccess: () => {
        reset();
      },
      onError: (error) => {
        applyServerErrors(error, setError);
      },
    });
  });

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex items-end gap-2">
      <div className="flex-1">
        <FormField
          label="Coupon code"
          autoComplete="off"
          error={formState.errors.code?.message}
          {...register('code')}
        />
      </div>
      <Button type="submit" variant="outline" disabled={apply.isPending}>
        Apply
      </Button>
    </form>
  );
}
