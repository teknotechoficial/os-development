import { createHmac, randomBytes, scryptSync, timingSafeEqual, createHash } from 'crypto';
import { createTransport, Transporter } from 'nodemailer';

const SCRYPT_N = 16384;
const SCRYPT_KEYLEN = 32;
const SALT_BYTES = 16;

export function hashSecret(value: string): string {
  const salt = randomBytes(SALT_BYTES);
  const hash = scryptSync(String(value), salt, SCRYPT_KEYLEN, { N: SCRYPT_N });
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifySecret(value: string | null | undefined, stored: string | null | undefined): boolean {
  if (!stored || typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt' || !parts[1] || !parts[2]) return false;
  try {
    const salt = Buffer.from(parts[1], 'hex');
    const expected = Buffer.from(parts[2], 'hex');
    if (salt.length === 0 || expected.length === 0) return false;
    const actual = scryptSync(String(value), salt, expected.length, { N: SCRYPT_N });
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

// HMAC key: optional AUTH_SECRET env, else derived from DATABASE_URL (stable per install)
function getSigningKey(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  const base = process.env.DATABASE_URL || 'postgresql://localhost:5432/nova_tech';
  return createHash('sha256').update(base).digest('hex');
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

// token = base64url(payload) + '.' + base64url(HMAC-SHA256(secret, payload))
export function signPayload(payload: string): string {
  const sig = createHmac('sha256', getSigningKey()).update(payload).digest('base64url');
  return `${b64url(payload)}.${sig}`;
}

export function verifySignedPayload(token: string | null | undefined): string | null {
  if (!token || typeof token !== 'string' || token.indexOf('.') === -1) return null;
  const dotIndex = token.indexOf('.');
  const payloadPart = token.slice(0, dotIndex);
  const sigPart = token.slice(dotIndex + 1);
  let payload: string;
  try {
    payload = Buffer.from(payloadPart, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  const expected = createHmac('sha256', getSigningKey()).update(payload).digest('base64url');
  const a = Buffer.from(sigPart);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return payload;
}

export function makeSetupToken(userId: string, ttlSeconds = 600): { token: string; expiresAt: number } {
  const expEpoch = Math.floor(Date.now() / 1000) + ttlSeconds;
  return { token: signPayload(`${userId}:setup:${expEpoch}`), expiresAt: expEpoch };
}

// Returns userId when the token is a valid, non-expired setup token
export function readSetupToken(token: string | null | undefined): string | null {
  const payload = verifySignedPayload(token);
  if (!payload) return null;
  const parts = payload.split(':');
  if (parts.length !== 3 || parts[1] !== 'setup') return null;
  const exp = Number(parts[2]);
  if (!Number.isFinite(exp) || Math.floor(Date.now() / 1000) > exp) return null;
  return parts[0];
}

export interface SmtpSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  smtpEnabled: boolean;
}

export function createMailTransport(smtp: SmtpSettings): Transporter {
  const port = Number(smtp.smtpPort) || 465;
  return createTransport({
    host: smtp.smtpHost,
    port,
    secure: port === 465,
    auth: smtp.smtpUser ? { user: smtp.smtpUser, pass: smtp.smtpPass } : undefined,
  });
}

export function mailFrom(smtp: SmtpSettings): string {
  return smtp.smtpFrom || smtp.smtpUser;
}
