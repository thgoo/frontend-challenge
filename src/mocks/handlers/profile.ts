import { http, HttpResponse } from 'msw';
import {
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TYPES,
  passwordChangeSchema,
  profileUpdateSchema,
} from '@/contracts/profile';
import { readDb, transaction } from '../db/store';
import { findAccountConflicts } from '../domain/users';
import { apiPath } from '../http/api';
import { createSalt, hashPassword, verifyPassword } from '../http/password';
import { apiError, readJson, validationError } from '../http/responses';
import { authenticate, toUser } from '../http/session';
import { FIELD_ERRORS } from '@/contracts/field-errors';

async function toDataUrl(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:${file.type};base64,${btoa(binary)}`;
}

function isAllowedAvatarType(type: string): boolean {
  return (AVATAR_MIME_TYPES as readonly string[]).includes(type);
}

export const profileHandlers = [
  http.get(apiPath('/profile'), ({ cookies }) => {
    const auth = authenticate(cookies);
    return auth.ok ? HttpResponse.json(toUser(auth.user)) : auth.response;
  }),

  http.patch(apiPath('/profile'), async ({ request, cookies }) => {
    const auth = authenticate(cookies);
    if (!auth.ok) return auth.response;
    const input = await readJson(request, profileUpdateSchema);
    if (!input.success) return validationError(input.error);

    const conflicts = findAccountConflicts(readDb(), input.data, auth.user.id);
    if (Object.keys(conflicts).length > 0) {
      return apiError(409, 'CONFLICT', 'These details belong to another account.', conflicts);
    }
    transaction(() => Object.assign(auth.user, input.data));
    return HttpResponse.json(toUser(auth.user));
  }),

  http.put(apiPath('/profile/avatar'), async ({ request, cookies }) => {
    const auth = authenticate(cookies);
    if (!auth.ok) return auth.response;
    const avatar = (await request.formData()).get('avatar');

    if (!(avatar instanceof File) || !isAllowedAvatarType(avatar.type)) {
      return apiError(422, 'VALIDATION_FAILED', 'Upload a PNG, JPEG or WebP image.', {
        avatar: FIELD_ERRORS.avatarType,
      });
    }
    if (avatar.size > AVATAR_MAX_BYTES) {
      return apiError(422, 'VALIDATION_FAILED', 'The image is too large.', {
        avatar: FIELD_ERRORS.avatarSize,
      });
    }
    const avatarUrl = await toDataUrl(avatar);
    transaction(() => {
      auth.user.avatarUrl = avatarUrl;
    });
    return HttpResponse.json(toUser(auth.user));
  }),

  http.put(apiPath('/profile/password'), async ({ request, cookies }) => {
    const auth = authenticate(cookies);
    if (!auth.ok) return auth.response;
    const input = await readJson(request, passwordChangeSchema);
    if (!input.success) return validationError(input.error);

    const { currentPassword, newPassword } = input.data;
    if (!(await verifyPassword(currentPassword, auth.user.passwordSalt, auth.user.passwordHash))) {
      return apiError(422, 'VALIDATION_FAILED', 'The current password is incorrect.', {
        currentPassword: FIELD_ERRORS.passwordIncorrect,
      });
    }
    const passwordSalt = createSalt();
    const passwordHash = await hashPassword(newPassword, passwordSalt);
    transaction(() => Object.assign(auth.user, { passwordSalt, passwordHash }));
    return new HttpResponse(null, { status: 204 });
  }),
];
