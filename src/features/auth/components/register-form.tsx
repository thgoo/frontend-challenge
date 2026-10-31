import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { FormField } from '@/components/form-field';
import { PasswordField } from '@/components/password-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { registerInputSchema } from '@/contracts/auth';
import { FIELD_ERRORS } from '@/contracts/field-errors';
import { applyServerErrors } from '@/lib/forms';
import { useRegister } from '../queries';
import { AUTH_INPUT } from './auth-styles';

const registerFormSchema = registerInputSchema
  .extend({ confirmPassword: z.string() })
  .refine((input) => input.password === input.confirmPassword, {
    path: ['confirmPassword'],
    message: FIELD_ERRORS.passwordMismatch,
  });
type RegisterForm = z.infer<typeof registerFormSchema>;

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const registerAccount = useRegister();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState } = useForm<RegisterForm>({
    resolver: zodResolver(registerFormSchema),
  });
  const { errors } = formState;

  // Awaited instead of mutate callbacks: signing in closes the dialog, unmounting this form.
  const submit = handleSubmit(async ({ confirmPassword: _confirm, ...input }) => {
    setFormError(null);
    try {
      await registerAccount.mutateAsync(input);
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
      return;
    }
    onSuccess();
  });

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="grid gap-3">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <FormField
        className={AUTH_INPUT}
        label="Nome de usuário"
        hideLabel
        autoComplete="username"
        placeholder="Nome de usuário"
        hint="De 3 a 20 letras minúsculas, números ou _."
        error={errors.username?.message}
        {...register('username')}
      />
      <FormField
        className={AUTH_INPUT}
        label="E-mail"
        hideLabel
        type="email"
        autoComplete="email"
        placeholder="Digite seu e-mail"
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordField
        className={AUTH_INPUT}
        label="Senha"
        hideLabel
        autoComplete="new-password"
        placeholder="Senha"
        hint="Pelo menos 8 caracteres, com letra e número."
        error={errors.password?.message}
        {...register('password')}
      />
      <PasswordField
        className={AUTH_INPUT}
        label="Confirmar senha"
        hideLabel
        autoComplete="new-password"
        placeholder="Confirmar senha"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button
        type="submit"
        disabled={registerAccount.isPending}
        className="mt-7 h-[60px] rounded-[10px] text-base font-bold lg:mt-3 lg:h-[45px] lg:rounded-sm"
      >
        {registerAccount.isPending ? (
          'Criando conta…'
        ) : (
          <>
            <span className="lg:hidden">Criar perfil</span>
            <span className="max-lg:hidden">Criar conta</span>
          </>
        )}
      </Button>
    </form>
  );
}
