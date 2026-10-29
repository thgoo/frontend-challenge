import type { ApiErrorCode } from '@/contracts/common';

export interface Failure {
  ok: false;
  status: number;
  code: ApiErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
}

export type Result<T> = { ok: true; value: T } | Failure;

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function fail(
  status: number,
  code: ApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
): Failure {
  return { ok: false, status, code, message, fieldErrors };
}
