import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { newsletterInputSchema, type NewsletterInput } from '@/contracts/newsletter';
import { errorMessage } from '@/i18n/api-errors';
import { fieldErrorMessage } from '@/i18n/field-errors';
import { subscribe } from '../api';

export function NewsletterForm() {
  const id = useId();
  const signup = useMutation({ mutationFn: subscribe });
  const { register, handleSubmit, reset, formState } = useForm<NewsletterInput>({
    resolver: zodResolver(newsletterInputSchema),
  });
  const error = formState.errors.email?.message;

  const submit = handleSubmit((input) => {
    signup.mutate(input, {
      onSuccess: () => {
        reset();
        toast.success('Inscrição confirmada. Você receberá os próximos lançamentos.');
      },
      onError: (mutationError) => toast.error(errorMessage(mutationError)),
    });
  });

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="grid gap-2">
      <label htmlFor={id} className="sr-only">
        E-mail para receber lançamentos
      </label>
      <div className="flex">
        <input
          id={id}
          type="email"
          autoComplete="email"
          placeholder="digite seu e-mail..."
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-10 min-w-0 flex-1 rounded-l-md bg-muted px-3 text-sm placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          {...register('email')}
        />
        <button
          type="submit"
          disabled={signup.isPending}
          className="h-10 rounded-r-md bg-primary px-4 text-base font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Enviar
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
