import { env } from '@/config/env';

export const API_PREFIX = env.apiUrl;
const apiBasePath = new URL(API_PREFIX, window.location.origin).pathname;

export function apiPath(path: `/${string}`): string {
  return `${API_PREFIX}${path}`;
}

/** `/api/nfts/1` -> `/nfts/1`, regardless of whether the API URL is relative or absolute. */
export function apiRelativePath(url: string): string {
  return new URL(url).pathname.slice(apiBasePath.length) || '/';
}
