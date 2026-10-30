import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { errorMessage } from '@/i18n/api-errors';
import { toApiRequestError } from './api-error';

/** Maps server-side field errors onto the form and returns the general, localized message. */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): string {
  const apiError = toApiRequestError(error);
  for (const [field, message] of Object.entries(apiError.fieldErrors)) {
    setError(field as Path<T>, { type: 'server', message });
  }
  return errorMessage(apiError);
}
