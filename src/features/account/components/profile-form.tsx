import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Field, FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { User } from '@/contracts/auth';
import { profileUpdateSchema, type ProfileUpdate } from '@/contracts/profile';
import { applyServerErrors } from '@/lib/forms';
import { useUpdateProfile } from '../queries';

export function ProfileForm({ user }: { user: User }) {
  const update = useUpdateProfile();
  const { register, handleSubmit, setError, reset, formState } = useForm<ProfileUpdate>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { name: user.name, username: user.username, email: user.email, bio: user.bio },
  });
  const { errors, isDirty } = formState;

  const submit = handleSubmit((input) => {
    update.mutate(input, {
      onSuccess: (saved) => {
        reset({ name: saved.name, username: saved.username, email: saved.email, bio: saved.bio });
        toast.success('Perfil atualizado.');
      },
      onError: (error) => {
        toast.error(applyServerErrors(error, setError));
      },
    });
  });

  return (
    <form
      noValidate
      onSubmit={(event) => void submit(event)}
      className="grid gap-x-7 gap-y-6 sm:grid-cols-2"
    >
      <FormField
        label="Nome de exibição"
        required
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
      <FormField
        label="Nome de usuário"
        required
        autoComplete="username"
        error={errors.username?.message}
        {...register('username')}
      />
      <FormField
        label="E-mail"
        required
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Field label="Bio" hint="Até 280 caracteres." error={errors.bio?.message}>
        {(control) => <Textarea rows={3} {...control} {...register('bio')} />}
      </Field>
      <Button
        type="submit"
        disabled={!isDirty || update.isPending}
        className="h-10 w-[131px] justify-self-start font-bold"
      >
        {update.isPending ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  );
}
