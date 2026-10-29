import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { registerInputSchema, type RegisterInput } from '@/contracts/auth';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { applyServerErrors } from '@/lib/forms';
import { useRegister } from '../queries';

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const registerAccount = useRegister();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState } = useForm<RegisterInput>({
    resolver: zodResolver(registerInputSchema),
  });
  const { errors } = formState;

  const submit = handleSubmit((input) => {
    setFormError(null);
    registerAccount.mutate(input, {
      onSuccess,
      onError: (error) => {
        setFormError(applyServerErrors(error, setError));
      },
    });
  });

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="grid gap-4">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <FormField
        label="Name"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
      <FormField
        label="Username"
        autoComplete="username"
        hint="3-20 lowercase letters, numbers or underscores."
        error={errors.username?.message}
        {...register('username')}
      />
      <FormField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <FormField
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters with a letter and a number."
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" disabled={registerAccount.isPending}>
        {registerAccount.isPending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
