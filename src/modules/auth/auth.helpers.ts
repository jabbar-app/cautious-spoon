
import * as bcrypt from 'bcrypt';
// import { buildVerifyUrl as buildUrlWithToken } from '../../common/utils/url'; // reuse helper; it just appends ?token=...
import { randomBytes } from 'crypto';

const lastForgotAt = new Map<string, number>();
const FORGOT_COOLDOWN_MS = 60_000;


function buildVerifyUrl(baseUrl: string, token: string) {
  const clean = baseUrl.replace(/\s+/g, '').replace(/\/+$/, '');
  return `${clean}/verify?token=${encodeURIComponent(token)}`;
}

function rounds() {
  return Number(process.env.BCRYPT_ROUNDS || 10);
}
async function findMatchingRefresh( plain: string, list: { id: string; token_hash: string; admin_id: string; expires_at: Date }[],) {
  for (const t of list) {
    if (await bcrypt.compare(plain, t.token_hash)) return t;
  }
  return null;
}

function setCookie(res: any | undefined, name: string, value: string, expires: Date) {
  if (!res) return;
  res.cookie(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    expires,
    path: '/',
    // domain: process.env.COOKIE_DOMAIN || undefined,  // set this in prod if needed
  });
}


function randomHex(len = 64) {
  return randomBytes(len).toString('hex').slice(0, len);
}

function parseTtlMs(s: string): number {
  const m = /^(\d+)([smhd])$/.exec(s);
  if (!m) return Number(s) || 0;
  const n = Number(m[1]), u = m[2];
  return u === 's' ? n * 1_000 : u === 'm' ? n * 60_000 : u === 'h' ? n * 3_600_000 : n * 86_400_000;
}

async function hash(pw: string) {
    return bcrypt.hash(pw, Number(process.env.BCRYPT_ROUNDS || 10));
}
async function signReset(payload: { email: string; typ: 'admin' | 'employer' | 'candidate' }) {
    return this.jwt.signAsync(
      { ...payload, purpose: 'reset' },
      { secret: process.env.JWT_RESET_SECRET || process.env.JWT_REFRESH_SECRET!, expiresIn: '1h' },
    );
  }

async function throttle(key: string) {
    const now = Date.now();
    const last = lastForgotAt.get(key) || 0;
    const throttled = now - last < FORGOT_COOLDOWN_MS;
    if (!throttled) lastForgotAt.set(key, now);
    return throttled;
  }

export {
    rounds,
    findMatchingRefresh,
    buildVerifyUrl,
    setCookie,
    randomHex,
    parseTtlMs,
    hash,
    throttle
}