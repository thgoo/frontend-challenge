import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { passwordChangeSchema } from '@/contracts/profile';
import { applyServerErrors } from '@/lib/forms';
import { useChangePassword } from '../queries';

const passwordFormSchema = passwordChangeSchema
  .and(z.object({ confirmPassword: z.string() }))
  .refine((input) => input.newPassword === input.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
type PasswordForm = z.infer<typeof passwordFormSchema>;

export function PasswordForm() {
  const change = useChangePassword();
  const { register, handleSubmit, setError, reset, formState } = useForm<PasswordForm>({
    resolver: zodResolver(passwordFormSchema),
  });
  const { errors } = formState;

  const submit = handleSubmit(({ currentPassword, newPassword }) => {
    change.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          reset();
          toast.success('Password changed.');
        },
        onError: (error) => {
          toast.error(applyServerErrors(error, setError));
        },
      },
    );
  });

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="grid gap-4">
      <FormField
        label="Current password"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <FormField
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters with a letter and a number."
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <FormField
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button type="submit" disabled={change.isPending} className="justify-self-start">
        {change.isPending ? 'Changing…' : 'Change password'}
      </Button>
    </form>
  );
}
