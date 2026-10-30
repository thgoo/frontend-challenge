import { useId, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/contracts/auth';
import { FIELD_ERRORS, type FieldError } from '@/contracts/field-errors';
import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES } from '@/contracts/profile';
import { errorMessage } from '@/i18n/api-errors';
import { fieldErrorMessage } from '@/i18n/field-errors';
import { toApiRequestError } from '@/lib/api-error';
import { useUploadAvatar } from '../queries';

function validateAvatar(file: File): FieldError | undefined {
  if (!(AVATAR_MIME_TYPES as readonly string[]).includes(file.type)) return FIELD_ERRORS.avatarType;
  if (file.size > AVATAR_MAX_BYTES) return FIELD_ERRORS.avatarSize;
  return undefined;
}

export function AvatarUpload({ user }: { user: User }) {
  const upload = useUploadAvatar();
  const [error, setError] = useState<string>();
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = error ? `${hintId} ${errorId}` : hintId;

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const invalid = validateAvatar(file);
    setError(invalid);
    if (invalid) return;
    upload.mutate(file, {
      onSuccess: () => toast.success('Avatar atualizado.'),
      onError: (uploadError) => {
        const fieldError = toApiRequestError(uploadError).fieldErrors.avatar;
        if (fieldError) setError(fieldError);
        else toast.error(errorMessage(uploadError));
      },
    });
  };

  return (
    <div className="grid gap-3">
      <p className="text-[15px]">Avatar</p>
      <div className="flex flex-wrap items-center gap-6">
        <Avatar className="size-[50px] bg-secondary">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={`Avatar de ${user.name}`} />}
          <AvatarFallback className="text-xl">{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <input
          id={inputId}
          type="file"
          aria-label="Alterar avatar"
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          accept={AVATAR_MIME_TYPES.join(',')}
          disabled={upload.isPending}
          onChange={onChange}
          className="peer sr-only"
        />
        <label
          htmlFor={inputId}
          className="inline-flex h-10 cursor-pointer items-center rounded-sm bg-primary px-6 text-sm font-bold text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:opacity-50 hover:bg-primary/90"
        >
          {upload.isPending ? 'Enviando…' : 'Alterar'}
        </label>
      </div>
      <p id={hintId} className="text-sm text-muted-foreground">
        PNG, JPEG ou WebP de até 2 MB.
      </p>
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {fieldErrorMessage(error)}
        </p>
      )}
    </div>
  );
}
