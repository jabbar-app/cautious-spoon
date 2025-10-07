// Generic helpers for Candidate module

// ---------- string utils ----------
export const norm = (v: any) => (v ?? '').toString().trim().toLowerCase();

// ---------- gender ----------
export function normalizeSexVal(v: any): 'male' | 'female' | null {
  const s = norm(v);
  if (!s) return null;
  const male = ['male','pria'];
  const female = ['female','wanita'];
  if (male.some((x) => s.includes(x))) return 'male';
  if (female.some((x) => s.includes(x))) return 'female';
  if (s === 'l') return 'male';
  if (s === 'p') return 'female';
  return null;
}

// ---------- date/age ----------
export function parseFlexibleDate(str: string): Date | null {
  if (!str) return null;
  const d1 = new Date(str);
  if (!Number.isNaN(d1.getTime())) return d1;

  const parts = str.split(/[\sT/.\-_:]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    const n = parts.map((p) => parseInt(p, 10));
    const [a, b, c] = n;
    let y = 0, m = 1, d = 1;
    if (a >= 1900) { y = a; m = b; d = c; }
    else if (c >= 1900) { y = c; m = a; d = b; }
    else return null;
    const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

export function getDobAsDate(birth_info: any): Date | null {
  if (!birth_info || typeof birth_info !== 'object') return null;
  if (typeof birth_info.date === 'string') {
    const dt = parseFlexibleDate(birth_info.date);
    if (dt) return dt;
  }
  if (typeof birth_info.year === 'number' && birth_info.year >= 1900) {
    const dt = new Date(Date.UTC(birth_info.year, 0, 1));
    if (!Number.isNaN(dt.getTime())) return dt;
  }
  return null;
}

export function computeAgeFromDate(dob: Date): number {
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const m = now.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}

// ---------- education ----------
const EDUCATION_MAP: Record<string, string[]> = {
  'sd/sederajat': ['sd'],
  'smp/sederajat': ['smp'],
  'sma/ma/smk/sederajat': ['sma'],
  'diploma satu/d1': ['d1'],
  'diploma dua/d2': ['d2'],
  'diploma tiga/d3': ['d3'],
  'sarjana/s1': ['s1'],
  'magister/s2': ['s2'],
  'doktor/s3': ['s3'],
};

export function degreeMatches(selectedUi: string[], education: any): boolean {
  if (!selectedUi.length) return true;
  const deg = norm(education?.degree); // e.g., "d1"
  if (!deg) return false;
  const codes = new Set<string>();
  for (const ui of selectedUi) {
    const arr = EDUCATION_MAP[norm(ui)] || [];
    arr.forEach((c) => codes.add(c));
  }
  return codes.size ? codes.has(deg) : true;
}

// ---------- domicile ----------
export function getDomicile(address_info: any): { country: string; city: string; prefecture: string } {
  const a = address_info || {};
  const useDom = norm(a.domicile_type) && norm(a.domicile_type) !== 'same';
  const city = useDom ? a.domicile_city : a.city;
  const province = useDom ? a.domicile_province : a.province;
  const prefecture = useDom ? a.domicile_prefecture : a.domicile_prefecture;
  const country = prefecture ? 'japan' : (province ? 'indonesia' : '');
  return { country, city: city ?? '', prefecture: prefecture ?? '' };
}

// ---------- experiences ----------
export function workMatchesTags(work: any, tags: string[]): boolean {
  if (!Array.isArray(tags) || tags.length === 0) return true;
  const hay = [
    norm(work?.industry),
    norm(work?.occupation),
    norm(work?.tag),
    norm(work?.field),
    norm(work?.company),
  ].filter(Boolean);
  return tags.some((t) => {
    const needle = norm(t);
    return hay.some((h) => h.includes(needle));
  });
}

export function workHasCertificate(work: any): boolean {
  return Boolean(norm(work?.certificate) || norm(work?.certificate_test) || work?.is_verified === true);
}

// ---------- skills/certs ----------
export function skillHasName(skill: any, name: string): boolean {
  const n = norm(skill?.name);
  const cert = norm(skill?.certificate);
  const needle = norm(name);
  return (!!n && n.includes(needle)) || (!!cert && cert.includes(needle));
}

export function skillHasTag(skill: any, tag: string): boolean {
  return norm(skill?.tag) === norm(tag);
}

export function skillHasLevel(skill: any, levels: string[]): boolean {
  const lvl = (skill?.level ?? '').toString().toUpperCase();
  return levels.includes(lvl);
}

// ---------- prisma helpers ----------
export const includeRelations = {
  candidate_work_exps: { where: { deleted_at: null } },
  candidate_skills: { where: { deleted_at: null } },
  candidate_webinars: {where: {deleted_at: null}},
  candidate_programs: {where: {deleted_at: null}},
  admin_candidates: {
    where: { deleted_at: null },
    select: {
      id_admin: true,
      admins: { select: { id: true, email: true, name: true } }, // adjust alias if needed
    },
  },
} as const;

export function parseSort(sort?: string): any[] | undefined {
  if (!sort) return [{ created_at: 'desc' }];
  const parts = sort.split(',').map((s) => s.trim()).filter(Boolean);
  const order: any[] = [];
  for (const p of parts) {
    const desc = p.startsWith('-');
    const key = desc ? p.slice(1) : p;
    if (!key) continue;
    order.push({ [key]: desc ? 'desc' : 'asc' } as any);
  }
  return order.length ? order : undefined;
}

export function stripSensitive<T extends Record<string, any>>(row: T | null): T | null {
  if (!row) return row;
  const { password, ...safe } = row;
  return safe as T;
}
