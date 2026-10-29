import axios, { type AxiosRequestConfig } from 'axios';
import type { z } from 'zod';
import { env } from '@/config/env';
import { ApiRequestError, toApiRequestError } from './api-error';

export const http = axios.create({
  baseURL: env.apiUrl,
  timeout: 10_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

type UnauthorizedListener = (error: ApiRequestError) => void;
const unauthorizedListeners = new Set<UnauthorizedListener>();

/** Lets the auth layer react to 401s without coupling the HTTP client to routing or caching. */
export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

http.interceptors.response.use(undefined, (error: unknown) => {
  if (axios.isCancel(error)) return Promise.reject(error as Error);
  const apiError = toApiRequestError(error);
  if (apiError.status === 401) {
    unauthorizedListeners.forEach((listener) => {
      listener(apiError);
    });
  }
  return Promise.reject(apiError);
});

/** Every response is validated against its contract, so the UI never consumes an unchecked shape. */
export async function request<T extends z.ZodType>(
  schema: T,
  config: AxiosRequestConfig,
): Promise<z.infer<T>> {
  const { data } = await http.request<unknown>(config);
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiRequestError(
      'CONTRACT_VIOLATION',
      `Unexpected response from ${config.url ?? 'the API'}.`,
    );
  }
  return parsed.data;
}
