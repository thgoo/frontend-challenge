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

  const submit = handleSubmit(({ confirmPassword: _confirm, ...input }) => {
    setFormError(null);
    registerAccount.mutate(input, {
      onSuccess,
      onError: (error) => {
        setFormError(applyServerErrors(error, setError));
      },
    });
  });

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="grid gap-3">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <FormField
        label="Nome de usuário"
        hideLabel
        autoComplete="username"
        placeholder="Nome de usuário"
        hint="De 3 a 20 letras minúsculas, números ou _."
        error={errors.username?.message}
        {...register('username')}
      />
      <FormField
        label="E-mail"
        hideLabel
        type="email"
        autoComplete="email"
        placeholder="Digite seu e-mail"
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordField
        label="Senha"
        hideLabel
        autoComplete="new-password"
        placeholder="Senha"
        hint="Pelo menos 8 caracteres, com letra e número."
        error={errors.password?.message}
        {...register('password')}
      />
      <PasswordField
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
        className="mt-3 h-[60px] rounded-xl text-base font-bold lg:h-[45px] lg:rounded-sm"
      >
        {registerAccount.isPending ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  );
}
