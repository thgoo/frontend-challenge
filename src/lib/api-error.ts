import { isAxiosError } from 'axios';
import { apiErrorSchema, type ApiErrorCode } from '@/contracts/common';

export type ClientErrorCode =
  ApiErrorCode | 'NETWORK_ERROR' | 'TIMEOUT' | 'CONTRACT_VIOLATION' | 'UNKNOWN';

export class ApiRequestError extends Error {
  readonly code: ClientErrorCode;
  readonly status: number | null;
  readonly fieldErrors: Readonly<Record<string, string>>;

  constructor(
    code: ClientErrorCode,
    message: string,
    status: number | null = null,
    fieldErrors: Readonly<Record<string, string>> = {},
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  /** Failures where retrying the same request may succeed. */
  get isTransient(): boolean {
    return this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT' || (this.status ?? 0) >= 500;
  }
}

export function toApiRequestError(error: unknown): ApiRequestError {
  if (error instanceof ApiRequestError) return error;
  if (!isAxiosError<unknown>(error)) {
    return new ApiRequestError(
      'UNKNOWN',
      error instanceof Error ? error.message : 'Unexpected error.',
    );
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiRequestError('TIMEOUT', 'The server took too long to respond.');
  }
  if (!error.response) {
    return new ApiRequestError(
      'NETWORK_ERROR',
      'Could not reach the server. Check your connection.',
    );
  }

  const { status, data } = error.response;
  const body = apiErrorSchema.safeParse(data);
  return body.success
    ? new ApiRequestError(body.data.code, body.data.message, status, body.data.fieldErrors)
    : new ApiRequestError('UNKNOWN', 'Unexpected server response.', status);
}

export function hasErrorCode(
  error: unknown,
  ...codes: ClientErrorCode[]
): error is ApiRequestError {
  return error instanceof ApiRequestError && codes.includes(error.code);
}
