import { z } from 'zod';

/**
 * Validated, typed environment configuration.
 * Throws at startup if required variables are missing/invalid.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  APP_NAME: z.string().default('Multi-Branch Accounting SaaS'),
  APP_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be >= 32 chars'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be >= 32 chars'),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(604800),
  JWT_ISSUER: z.string().default('accounting-saas'),
  JWT_AUDIENCE: z.string().default('accounting-saas-clients'),

  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
export type Env = typeof env;
