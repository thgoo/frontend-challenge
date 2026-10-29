import { z } from 'zod';

const envSchema = z.object({
  VITE_ENABLE_MOCKS: z.stringbool().default(false),
  VITE_API_URL: z.string().min(1).default('/api'),
});

const parsed = envSchema.parse(import.meta.env);

export const env = {
  enableMocks: parsed.VITE_ENABLE_MOCKS,
  apiUrl: parsed.VITE_API_URL,
} as const;
