import type { z } from 'zod';

/** Storage can be unavailable (private mode, quota); persistence is best-effort by design. */
export function readStored<T extends z.ZodType>(key: string, schema: T): z.infer<T> | undefined {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return undefined;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export function writeStored(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort only.
  }
}

export function removeStored(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Best-effort only.
  }
}
