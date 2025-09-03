import { BadRequestException, ForbiddenException } from '@nestjs/common';

const BAD = new Set(['', '.', '..']);

export function normalizeFolderPath(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new BadRequestException({ code: 'INVALID_PATH', details: 'Missing path' });
  }
  let p = input.replace(/\\/g, '/').trim();
  if (p.startsWith('/')) p = p.slice(1);
  // collapse duplicate slashes
  p = p.replace(/\/{2,}/g, '/');

  const parts = p.split('/').map(seg => {
    try {
      const dec = decodeURIComponent(seg);
      return dec;
    } catch {
      return seg; // keep as-is if decode fails
    }
  });

  if (parts.some(seg => BAD.has(seg) || seg.includes('..'))) {
    throw new BadRequestException({ code: 'PATH_TRAVERSAL_DETECTED' });
  }

  // drop trailing slash
  if (parts.length && parts[parts.length - 1] === '') parts.pop();

  if (!parts.length) {
    throw new BadRequestException({ code: 'INVALID_PATH', details: 'Empty path' });
  }
  return parts.join('/');
}

export function sanitizeExt(originalName: string, mime: string): string {
  const m = originalName?.match(/\.[A-Za-z0-9]{1,10}$/);
  const extFromName = m ? m[0].toLowerCase() : '';
  if (extFromName) return extFromName;

  // fallback to common mappings
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  };
  return map[mime] || '';
}

/**
 * Ownership rules:
 * - superadmin/admin: full access
 * - candidate: path must start with "candidates/<userId>/" OR "<userId>/"
 * - employer: path must start with "employers/<userId>/" OR "<userId>/"
 */
export function assertOwnership(user: any, key: string) {
  const typ = user?.typ;
  const uid = user?.id || user?.sub;
  if (!typ || !uid) throw new ForbiddenException({ code: 'FORBIDDEN', details: 'Missing identity' });

  if (typ === 'superadmin' || typ === 'admin') return; // bypass

  const startsWith = (prefix: string) => key.startsWith(prefix.endsWith('/') ? prefix : prefix + '/');

  if (typ === 'candidate') {
    if (startsWith(`candidates/${uid}`) || startsWith(`${uid}`)) return;
    throw new ForbiddenException({ code: 'FORBIDDEN_OWNER' });
  }
  if (typ === 'employer') {
    if (startsWith(`employers/${uid}`) || startsWith(`${uid}`)) return;
    throw new ForbiddenException({ code: 'FORBIDDEN_OWNER' });
  }

  // default: forbid unknown types
  throw new ForbiddenException({ code: 'FORBIDDEN' });
}

export function isMimeAllowed(mime: string): boolean {
  const env = process.env.CDN_ALLOWED_MIME ||
    'application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const allowed = new Set(env.split(',').map(s => s.trim()).filter(Boolean));
  return allowed.has(mime);
}

export function maxBytes(): number {
  const mb = Number(process.env.CDN_MAX_MB || 10);
  return Math.max(1, mb) * 1024 * 1024;
}
