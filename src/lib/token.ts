import { createHash, randomBytes } from 'node:crypto';

/** Generates an opaque, high-entropy refresh token (returned once to client). */
export function generateOpaqueToken(): string {
  return randomBytes(48).toString('hex');
}

/** Deterministic hash stored in DB so raw refresh tokens never persist. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
