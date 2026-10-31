import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { PasswordField } from '@/components/password-field';
import { Button } from '@/components/ui/button';
import { FIELD_ERRORS } from '@/contracts/field-errors';
import { passwordChangeSchema } from '@/contracts/profile';
import { applyServerErrors } from '@/lib/forms';
import { useChangePassword } from '../queries';

const passwordFormSchema = passwordChangeSchema
  .and(z.object({ confirmPassword: z.string() }))
  .refine((input) => input.newPassword === input.confirmPassword, {
    path: ['confirmPassword'],
    message: FIELD_ERRORS.passwordMismatch,
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
          toast.success('Senha alterada.');
        },
        onError: (error) => {
          toast.error(applyServerErrors(error, setError));
        },
      },
    );
  });

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="grid max-w-[417px] gap-6">
      <PasswordField
        label="Senha atual"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <PasswordField
        label="Nova senha"
        autoComplete="new-password"
        hint="Pelo menos 8 caracteres, com letra e número."
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <PasswordField
        label="Confirmar nova senha"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button
        type="submit"
        disabled={change.isPending}
        className="h-10 justify-self-start rounded-[3px] px-6 font-bold"
      >
        {change.isPending ? 'Alterando…' : 'Alterar senha'}
      </Button>
    </form>
  );
}
