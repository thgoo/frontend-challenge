import { useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { Field } from '@/components/form-field';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import type { User } from '@/contracts/auth';
import { FIELD_ERRORS, type FieldError } from '@/contracts/field-errors';
import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES } from '@/contracts/profile';
import { errorMessage } from '@/i18n/api-errors';
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

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const invalid = validateAvatar(file);
    setError(invalid);
    if (invalid) return;
    upload.mutate(file, {
      onSuccess: () => toast.success('Avatar updated.'),
      onError: (uploadError) => {
        const fieldError = toApiRequestError(uploadError).fieldErrors.avatar;
        if (fieldError) setError(fieldError);
        else toast.error(errorMessage(uploadError));
      },
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-6">
      <Avatar className="size-24">
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={`${user.name}'s avatar`} />}
        <AvatarFallback className="text-2xl">{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <Field label="Change avatar" hint="PNG, JPEG or WebP up to 2 MB." error={error}>
          {(control) => (
            <Input
              {...control}
              type="file"
              accept={AVATAR_MIME_TYPES.join(',')}
              disabled={upload.isPending}
              onChange={onChange}
            />
          )}
        </Field>
      </div>
    </div>
  );
}
