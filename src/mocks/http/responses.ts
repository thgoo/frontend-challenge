import { HttpResponse } from 'msw';
import type { z } from 'zod';
import type { ApiError, ApiErrorCode } from '@/contracts/common';

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
) {
  return HttpResponse.json<ApiError>({ code, message, fieldErrors }, { status });
}

const STATUS_CODES: Record<number, ApiErrorCode> = {
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
};

export function apiErrorForStatus(status: number) {
  return apiError(
    status,
    STATUS_CODES[status] ?? 'SERVICE_UNAVAILABLE',
    status >= 500
      ? 'The service is temporarily unavailable.'
      : 'The request could not be completed.',
  );
}

export function validationError(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'form';
    fieldErrors[field] ??= issue.message;
  }
  return apiError(422, 'VALIDATION_FAILED', 'Some fields are invalid.', fieldErrors);
}

export async function readJson<T extends z.ZodType>(request: Request, schema: T) {
  const body: unknown = await request.json().catch(() => undefined);
  return schema.safeParse(body);
}
