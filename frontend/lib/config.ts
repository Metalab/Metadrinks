import { env } from 'next-runtime-env';

export const config = {
  apiBaseUrl: env('NEXT_PUBLIC_API_URL') || 'http://localhost:8080',
} as const;