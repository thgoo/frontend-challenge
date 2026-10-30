import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormField } from '@/components/form-field';
import { PasswordField } from '@/components/password-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { loginInputSchema, type LoginInput } from '@/contracts/auth';
import { applyServerErrors } from '@/lib/forms';
import { useLogin } from '../queries';

const SUBMIT_CLASS = 'h-[60px] rounded-xl text-base font-bold lg:h-[45px] lg:rounded-sm';

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const login = useLogin();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
  });
  const { errors } = formState;

  const submit = handleSubmit((input) => {
    setFormError(null);
    login.mutate(input, {
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
        label="E-mail"
        hideLabel
        type="email"
        autoComplete="email"
        placeholder="contato@email.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordField
        label="Senha"
        hideLabel
        autoComplete="current-password"
        placeholder="Senha"
        error={errors.password?.message}
        {...register('password')}
      />
      <button
        type="button"
        onClick={() => {
          toast.info('A recuperação de senha não está disponível nesta demonstração.');
        }}
        className="justify-self-end text-sm text-highlight hover:underline"
      >
        Esqueceu a senha?
      </button>
      <Button type="submit" disabled={login.isPending} className={`mt-3 ${SUBMIT_CLASS}`}>
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}
