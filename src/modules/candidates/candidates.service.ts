import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
// import type { Prisma } from '@prisma/client';
import type { ListCandidates } from './dto/list-candidates.dto';

// helpers split out
import {
  parseSort,
  stripSensitive,
  norm,
  normalizeSexVal,
  getDobAsDate,
  computeAgeFromDate,
  degreeMatches,
  getDomicile,
  workMatchesTags,
  workHasCertificate,
  skillHasName,
  skillHasTag,
  skillHasLevel,
} from './candidate.helpers';
import { UpdateCandidateProgramDto } from './dto/programs/update-candidate-program.dto';
import { SelfUpdateProgramDto } from './dto/programs/self-update-program.dto';
import { SelfCreateProgramDto } from './dto/programs/self-create-program.dto';

export type TestScheduleInput =
  | string
  | { start: string; end: string; mode: string; link?: string | null };

export function buildTestSchedule(
  v?: TestScheduleInput | null,
): string | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === '') return '';
  if (typeof v === 'string') return v; // already stored format: "start/end/mode/link?"
  const { start, end, mode, link } = v;
  return [start, end, mode, link ?? ''].join('/');
}

export function deepMerge<T extends Record<string, any>>(
  base: T,
  patch?: Partial<T> | null,
): T {
  if (!patch) return base;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (
      v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      typeof out[k] === 'object' &&
      out[k] !== null
    ) {
      out[k] = deepMerge(out[k], v as any);
    } else {
      out[k] = v;
    }
  }
  return out;
}

const candidateSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  sex: true,
  talent_id: true,
  address_info: true,
} as const;

function stripIsPaid<T extends Record<string, any>>(
  p?: T | null,
): T | undefined {
  if (!p) return undefined;
  const { is_paid, ...rest } = p;
  return rest as T;
}

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCandidate(
    dto: {
      email: string;
      password: string;
      name?: string;
      phone?: string;
      sex?: string;
      birth_date?: string;
      address_info?: any;
      birth_info?: any;
      document?: any;
      education?: any;
      marital_status?: string;
      religion?: string;
      status?: number;
      onboarding?: boolean;
      verified?: any;
      talent_id?: string; // ignored; we always auto-generate
    },
    actorId?: string,
    actorType?: string,
  ) {
    const hash = await bcrypt.hash(dto.password, 12);
    const talentId = await this.nextTalentId(); // always auto
    const created = await this.prisma.candidates.create({
      data: {
        id: randomUUID(),
        email: dto.email,
        password: hash,
        name: dto.name ?? '',
        phone: dto.phone ?? '',
        sex: dto.sex ?? '',
        address_info: dto.address_info ?? {},
        birth_info: dto.birth_info ?? {},
        document: dto.document ?? {},
        education: dto.education ?? {},
        marital_status: dto.marital_status ?? '',
        religion: dto.religion ?? '',
        status: dto.status ?? 1,
        onboarding: dto.onboarding ?? false,
        verified: dto.verified ?? {},
        talent_id: talentId,
        created_at: new Date(),
        created_by: actorId ?? '',
      },
      include: {
        candidate_work_exps: { where: { deleted_at: null } },
        candidate_skills: { where: { deleted_at: null } },
        candidate_webinars: { where: { deleted_at: null } },
        candidate_programs: {},
      },
    });

    // NOTE: no admin-candidate attachment here anymore.
    return stripSensitive(created);
  }

  private isUuidLike(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    const re =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return re.test(value.trim());
  }

  // (Optional) tiny util
  private uniqueStrings(arr: unknown[]): string[] {
    return Array.from(
      new Set(
        (arr || [])
          .map((x) => (typeof x === 'string' ? x.trim() : String(x ?? '')))
          .filter((x) => x.length > 0),
      ),
    );
  }

  async createByAdmin(
    dto: {
      email: string;
      password: string;
      name?: string;
      phone?: string;
      sex?: string;
      birth_date?: string;
      address_info?: any;
      birth_info?: any;
      document?: any;
      education?: any;
      marital_status?: string;
      religion?: string;
      status?: number;
      onboarding?: boolean;
      verified?: any;
      talent_id?: string;
      owner_admin_ids?: string[];
    },
    actorId?: string,
    actorType?: string,
  ) {
    const hash = await bcrypt.hash(dto.password, 12);

    const talentId = await this.nextTalentId();

    const created = await this.prisma.candidates.create({
      data: {
        id: randomUUID(),
        email: dto.email,
        password: hash,
        name: dto.name ?? '',
        phone: dto.phone ?? '',
        sex: dto.sex ?? '',
        address_info: dto.address_info ?? {},
        birth_info: dto.birth_info ?? {},
        document: dto.document ?? {},
        education: dto.education ?? {},
        marital_status: dto.marital_status ?? '',
        religion: dto.religion ?? '',
        status: dto.status ?? 1,
        onboarding: dto.onboarding ?? false,
        verified: dto.verified ?? {},
        talent_id: talentId ?? '',
        created_at: new Date(),
        created_by: actorId ?? '',
      },
      include: {
        candidate_work_exps: { where: { deleted_at: null } },
        candidate_skills: { where: { deleted_at: null } },
        candidate_webinars: { where: { deleted_at: null } },
        candidate_programs: {},
      },
    });

    // seed owners
    const seed = new Set<string>(
      (dto.owner_admin_ids ?? []).map(String).filter(Boolean),
    );
    if (
      (!dto.owner_admin_ids || dto.owner_admin_ids.length === 0) &&
      actorType === 'admin' &&
      actorId
    ) {
      seed.add(actorId);
    }
    if (seed.size) {
      await this.setAdminOwnersInternal(
        created.id,
        Array.from(seed),
        [],
        actorId,
      );
      const fresh = await this.prisma.candidates.findFirst({
        where: { id: created.id },
        include: {
          candidate_work_exps: { where: { deleted_at: null } },
          candidate_skills: { where: { deleted_at: null } },
          candidate_webinars: { where: { deleted_at: null } },
          candidate_programs: {},
        },
      });
      return stripSensitive(fresh);
    }

    return stripSensitive(created);
  }

  // ---------- Set Admin Owners to Candidate ----------
  async setAdminOwners(
    candidateId: string,
    attachIds: string[],
    detachIds: string[],
    actorId?: string,
  ) {
    const exists = await this.prisma.candidates.findFirst({
      where: { id: candidateId, deleted_at: null },
      select: { id: true },
    });
    if (!exists)
      throw new NotFoundException({
        code: 'CANDIDATE_NOT_FOUND',
        details: candidateId,
      });

    await this.setAdminOwnersInternal(
      candidateId,
      attachIds,
      detachIds,
      actorId,
    );

    const owners = await this.prisma.admin_candidates.findMany({
      where: { id_candidate: candidateId, deleted_at: null },
      select: {
        id_admin: true,
        admins: { select: { id: true, email: true, name: true } },
      },
      orderBy: { id_admin: 'asc' },
    });

    return {
      attached: attachIds.length,
      detached: detachIds.length,
      admins: owners.map((o: any) => o.admins),
    };
  }

  private async setAdminOwnersInternal(
    candidateId: string,
    attachIds: string[],
    detachIds: string[],
    actorId?: string,
  ) {
    const uniq = (arr: string[]) =>
      Array.from(new Set(arr.map(String))).filter(Boolean);
    const attach = uniq(attachIds);
    const detach = uniq(detachIds);

    // validate admin ids exist
    const union = uniq([...attach, ...detach]);
    if (union.length) {
      const admins = await this.prisma.admins.findMany({
        where: { id: { in: union }, deleted_at: null },
        select: { id: true },
      });
      const ok = new Set(admins.map((a) => a.id));
      // keep only valid admin IDs
      for (let i = attach.length - 1; i >= 0; i--)
        if (!ok.has(attach[i])) attach.splice(i, 1);
      for (let i = detach.length - 1; i >= 0; i--)
        if (!ok.has(detach[i])) detach.splice(i, 1);
    }

    await this.prisma.$transaction(async (tx) => {
      // find existing links for attach
      const existing = await tx.admin_candidate.findMany({
        where: { id_candidate: candidateId, id_admin: { in: attach } },
        select: { id_admin: true, deleted_at: true },
      });
      const map = new Map(existing.map((l) => [l.id_admin, l.deleted_at]));

      const toCreate: {
        id_candidate: string;
        id_admin: string;
        created_by?: string;
      }[] = [];
      const toRevive: string[] = [];

      for (const id of attach) {
        if (!map.has(id))
          toCreate.push({
            id_candidate: candidateId,
            id_admin: id,
            ...(actorId ? { created_by: actorId } : {}),
          });
        else if (map.get(id) !== null) toRevive.push(id);
      }

      if (toCreate.length) {
        await tx.admin_candidate.createMany({
          data: toCreate,
          skipDuplicates: true,
        });
      }

      if (toRevive.length) {
        await tx.admin_candidate.updateMany({
          where: { id_candidate: candidateId, id_admin: { in: toRevive } },
          data: {
            deleted_at: null,
            updated_at: new Date(),
            ...(actorId ? { updated_by: actorId } : {}),
          },
        });
      }

      if (detach.length) {
        await tx.admin_candidate.updateMany({
          where: {
            id_candidate: candidateId,
            id_admin: { in: detach },
            deleted_at: null,
          },
          data: {
            deleted_at: new Date(),
            ...(actorId ? { deleted_by: actorId } : {}),
          },
        });
      }
    });
  }

  // ---------- Candidate Details ----------
  // async detailsExpanded(candidateId: string) {
  //   // 1) Base fetch (unchanged)
  //   const data = await this.prisma.candidates.findFirst({
  //     where: { id: candidateId, deleted_at: null },
  //     include: {
  //       candidate_work_exps: { where: { deleted_at: null } },
  //       candidate_skills:   { where: { deleted_at: null } },
  //       candidate_webinars: { where: { deleted_at: null } },
  //       candidate_programs: { select: {
  //         id_program: true,
  //         status : true,
  //         created_at : true,
  //         updated_at : true,
  //       }},
  //       admin_candidatess: {
  //         where: { deleted_at: null },
  //         select: {
  //           id_admin: true,
  //           admins: { select: { id: true, email: true, name: true } },
  //         },
  //       },
  //     },
  //   });
  //   if (!data) throw new NotFoundException({ code: 'CANDIDATE_NOT_FOUND', details: candidateId });

  //   // 2) Collect unique occupation & industry IDs from both arrays (if properties exist)
  //   const workExps = data.candidate_work_exps ?? [];
  //   const skills   = data.candidate_skills ?? [];

  //   const collect = (arr: any[], key: 'occupation' | 'industry') =>
  //     Array.from(new Set(arr.map((r) => r?.[key]).filter(Boolean)));

  //   const occIds = Array.from(new Set([
  //     ...collect(workExps, 'occupation'),
  //     ...collect(skills,   'occupation'),
  //   ]));

  //   const indIds = Array.from(new Set([
  //     ...collect(workExps, 'industry'),
  //     ...collect(skills,   'industry'),
  //   ]));

  //   // 3) Bulk load referenced tables (respect soft delete if you use it)
  //   const [occRows, indRows] = await Promise.all([
  //     occIds.length
  //       ? this.prisma.occupations.findMany({
  //           where: { id: { in: occIds as string[] }, deleted_at: null },
  //         })
  //       : Promise.resolve([] as any[]),
  //     indIds.length
  //       ? this.prisma.job_industries.findMany({
  //           where: { id: { in: indIds as string[] }, deleted_at: null },
  //         })
  //       : Promise.resolve([] as any[]),
  //   ]);

  //   // 4) Build lookup maps
  //   const occMap = new Map<string, any>(occRows.map((o) => [o.id, o]));
  //   const indMap = new Map<string, any>(indRows.map((i) => [i.id, i]));

  //   // 5) Replace string IDs with full objects (fallback to { id } stub if not found)
  //   const inflate = (arr: any[]) =>
  //     arr.map((r) => {
  //       const occId = r?.occupation;
  //       const indId = r?.industry;
  //       return {
  //         ...r,
  //         occupation: occId ? (occMap.get(occId) ?? { id: occId }) : null,
  //         industry:   indId ? (indMap.get(indId) ?? { id: indId }) : null,
  //       };
  //     });

  //   const enriched = {
  //     ...data,
  //     candidate_work_exps: inflate(workExps),
  //     candidate_skills:    inflate(skills), // safe even if skill rows don't have occupation/industry
  //   };

  //   return enriched;
  // }
  // —— MAIN METHOD (replaces your current detailsExpanded) ——
  async detailsExpanded(candidateId: string) {
    // 1) Base fetch
    const data = await this.prisma.candidates.findFirst({
      where: { id: candidateId, deleted_at: null },
      include: {
        candidate_work_exps: { where: { deleted_at: null } },
        candidate_skills: { where: { deleted_at: null } },
        candidate_webinars: { where: { deleted_at: null } },
        candidate_programs: {
          select: {
            id_program: true,
            status: true,
            created_at: true,
            updated_at: true,
          },
        },
        admin_candidate: {
          where: { deleted_at: null },
          select: {
            id_admin: true,
            admins: { select: { id: true, email: true, name: true } },
          },
        },
      },
    });
    if (!data)
      throw new NotFoundException({
        code: 'CANDIDATE_NOT_FOUND',
        details: candidateId,
      });

    // 2) Collect raw refs from both arrays
    const workExps: any[] = data.candidate_work_exps ?? [];
    const skills: any[] = data.candidate_skills ?? [];

    const collect = (arr: any[], key: 'occupation' | 'industry') =>
      this.uniqueStrings(arr.map((r) => r?.[key]).filter(Boolean));

    const occAll = this.uniqueStrings([
      ...collect(workExps, 'occupation'),
      ...collect(skills, 'occupation'),
    ]);
    const indAll = this.uniqueStrings([
      ...collect(workExps, 'industry'),
      ...collect(skills, 'industry'),
    ]);

    const occUuidIds = occAll.filter((v) => this.isUuidLike(v));
    const occNonUuid = occAll.filter((v) => !this.isUuidLike(v));
    const indUuidIds = indAll.filter((v) => this.isUuidLike(v));
    const indNonUuid = indAll.filter((v) => !this.isUuidLike(v));

    // 3) Bulk load UUID-only rows (respect soft delete if present on your models)
    const [occRows, indRows] = await Promise.all([
      occUuidIds.length
        ? this.prisma.occupations.findMany({
            where: { id: { in: occUuidIds }, deleted_at: null },
          })
        : Promise.resolve([] as any[]),
      indUuidIds.length
        ? this.prisma.job_industries.findMany({
            where: { id: { in: indUuidIds }, deleted_at: null },
          })
        : Promise.resolve([] as any[]),
    ]);

    // 4) Build lookup maps for found UUIDs
    const occMap = new Map<string, any>(occRows.map((o) => [o.id, o]));
    const indMap = new Map<string, any>(indRows.map((i) => [i.id, i]));

    // 5) Resolver for a single ref with Option A (inline union + _meta)
    type RefMeta = { resolved: boolean; reason?: 'not_uuid' | 'not_found' };
    type RefUnresolved =
      | { id: null; label: string; _meta: RefMeta } // not_uuid case
      | { id: string; _meta: RefMeta }; // uuid but not found
    // When resolved, we return the full Prisma row + _meta
    // eslint-disable-next-line @typescript-eslint/ban-types
    const resolveRef = (
      raw: any,
      map: Map<string, any>,
    ): any | RefUnresolved | null => {
      if (raw == null) return null;

      const str = String(raw);
      if (!this.isUuidLike(str)) {
        // Not a UUID: treat as label (verbatim)
        return {
          id: null,
          label: str,
          _meta: { resolved: false, reason: 'not_uuid' as const },
        };
      }
      const row = map.get(str);
      if (row) {
        return { ...row, _meta: { resolved: true } as RefMeta };
      }
      return {
        id: str,
        _meta: { resolved: false, reason: 'not_found' as const },
      };
    };

    // 6) Inflate both arrays; also keep *_raw mirrors for traceability
    const inflate = (arr: any[]) =>
      (arr ?? []).map((r) => {
        const occRaw = r?.occupation ?? null;
        const indRaw = r?.industry ?? null;
        return {
          ...r,
          occupation: resolveRef(occRaw, occMap),
          industry: resolveRef(indRaw, indMap),
          occupation_raw: occRaw ?? null,
          industry_raw: indRaw ?? null,
        };
      });

    // 7) Return enriched shape
    return {
      ...data,
      candidate_work_exps: inflate(workExps),
      candidate_skills: inflate(skills),
      // candidate_webinars and others unchanged
    };
  }

  private async nextTalentId(): Promise<string> {
    const recent = await this.prisma.candidates.findMany({
      where: { talent_id: { not: '' } },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      select: { talent_id: true },
      take: 100, // scan recent 100; adjust if needed
    });

    let maxNum = 0;
    // default width 6 based on your example "002836"
    let width = 6;

    for (const r of recent) {
      const raw = r.talent_id ?? '';
      const digits = raw.replace(/\D+/g, ''); // keep only 0-9
      if (!digits) continue;
      width = Math.max(width, digits.length);
      const n = parseInt(digits, 10);
      if (Number.isFinite(n) && n > maxNum) maxNum = n;
    }

    const next = maxNum + 1;
    return next.toString().padStart(width, '0');
  }

  // default: paginated; pass all=true to disable pagination
  async listAllWithRelations(q: ListCandidates) {
    const rows = await this.prisma.candidates.findMany({
      where: {
        deleted_at: null,
        ...(q.search
          ? {
              OR: [
                { email: { contains: q.search, mode: 'insensitive' } },
                { name: { contains: q.search, mode: 'insensitive' } },
                { phone: { contains: q.search, mode: 'insensitive' } },
                { talent_id: { contains: q.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: parseSort(q.sort) as any,
      include: {
        candidate_work_exps: { where: { deleted_at: null } },
        candidate_skills: { where: { deleted_at: null } },
        candidate_webinars: { where: { deleted_at: null } },
        candidate_programs: {},
        admin_candidate: {
          where: { deleted_at: null },
          select: {
            id_admin: true,
            admins: { select: { id: true, email: true, name: true } }, // adjust alias if needed
          },
        },
      },
    });

    // ---- normalize incoming filters ----
    const genders = (q.gender ?? []) as string[];
    const bothGendersSelected =
      genders.includes('male') && genders.includes('female');
    const ageMin = q.ageMin ?? 18;
    const ageMax = q.ageMax ?? 55;

    const eduUi = (q.education ?? []) as string[];
    const maritals = (q.maritalStatus ?? []) as string[];
    const domCountry = (q.domicileCountry ?? 'All').toLowerCase();
    const domCity = norm(q.domicileCity);
    const domPref = norm(q.domicilePrefecture);

    const expTags = (q.experiences ?? []) as string[];
    const wantExpCert = !!q.expHasCertificate;

    const certNames = (q.certNames ?? []) as string[];
    const jlpt = ((q.jlpt ?? []) as string[]).map((s) => s.toUpperCase());
    const nat = ((q.nat ?? []) as string[]).map((s) => s.toUpperCase());
    const wantJft = !!q.jft;
    const wantNurse = !!q.nurse;

    const filtered = rows.filter((c: any) => {
      // gender
      if (genders.length && !bothGendersSelected) {
        const sx = normalizeSexVal(c.sex);
        if (!sx || !genders.includes(sx)) return false;
      }

      // age (if DOB present)
      const dob = getDobAsDate(c.birth_info);
      if (dob) {
        const age = computeAgeFromDate(dob);
        if (age < ageMin || age > ageMax) return false;
      }

      // education
      if (eduUi.length) {
        if (!degreeMatches(eduUi, c.education)) return false;
      }

      // marital status (exact match)
      if (maritals.length) {
        const m = norm(c.marital_status);
        if (!maritals.some((x) => m === norm(x))) return false;
      }

      // domicile
      if (domCountry !== 'all') {
        const d = getDomicile(c.address_info);
        if (d.country !== domCountry) return false;
        if (domCountry === 'indonesia' && domCity) {
          if (!norm(d.city).includes(domCity)) return false;
        }
        if (domCountry === 'japan' && domPref) {
          if (!norm(d.prefecture).includes(domPref)) return false;
        }
      }

      // experiences (+cert)
      if (expTags.length || wantExpCert) {
        const works = Array.isArray(c.candidate_work_exps)
          ? c.candidate_work_exps
          : [];
        if (!works.length) return false;

        const matchedWorks = expTags.length
          ? works.filter((w: any) => workMatchesTags(w, expTags))
          : works;
        if (expTags.length && matchedWorks.length === 0) return false;
        if (wantExpCert) {
          const hasCert = matchedWorks.some((w: any) => workHasCertificate(w));
          if (!hasCert) return false;
        }
      }

      // skills / certs
      const skills = Array.isArray(c.candidate_skills)
        ? c.candidate_skills
        : [];

      if (certNames.length) {
        const hitAll = certNames.every((name) =>
          skills.some((s) => skillHasName(s, name)),
        );
        if (!hitAll) return false;
      }

      if (jlpt.length) {
        const hit = skills.some(
          (s) => skillHasTag(s, 'JLPT') && skillHasLevel(s, jlpt),
        );
        if (!hit) return false;
      }

      if (nat.length) {
        const hit = skills.some(
          (s) => skillHasTag(s, 'NAT') && skillHasLevel(s, nat),
        );
        if (!hit) return false;
      }

      if (wantJft) {
        const hit = skills.some(
          (s) => skillHasTag(s, 'JFT') || norm(s.name).includes('jft'),
        );
        if (!hit) return false;
      }

      if (wantNurse) {
        const hit = skills.some(
          (s) => skillHasTag(s, 'NURSE') || /nurse|perawat/i.test(s.name ?? ''),
        );
        if (!hit) return false;
      }

      return true;
    });

    // ---- pagination (default ON) ----
    const all = !!q.all;
    const page = Math.max(1, q.page ?? 1);
    const perPage = Math.max(1, q.perPage ?? 20);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const items = all ? filtered : filtered.slice(start, end);

    const data = items.map(stripSensitive);

    return {
      items: data,
      pagination: all
        ? null
        : { page, perPage, total, totalPages, nextCursor: null },
    };
  }

  async details(id: string) {
    const row = await this.prisma.candidates.findFirst({
      where: { id, deleted_at: null },
      include: {
        candidate_work_exps: { where: { deleted_at: null } },
        candidate_skills: { where: { deleted_at: null } },
        candidate_webinars: { where: { deleted_at: null } },
        candidate_programs: {},
        admin_candidate: {
          where: { deleted_at: null },
          select: {
            id_admin: true,
            admins: { select: { id: true, email: true, name: true } }, // adjust alias if needed
          },
        },
      },
    });
    if (!row)
      throw new NotFoundException({ code: 'CANDIDATE_NOT_FOUND', details: id });
    return stripSensitive(row);
  }

  async updateMe(id: string, dto: any) {
    if ('password' in dto) {
      const { password, ...rest } = dto;
      dto = rest;
    }

    const exists = await this.prisma.candidates.findFirst({
      where: { id, deleted_at: null },
      select: { id: true },
    });
    if (!exists)
      throw new NotFoundException({ code: 'CANDIDATE_NOT_FOUND', details: id });

    const updated = await this.prisma.candidates.update({
      where: { id },
      data: {
        ...dto,
        updated_by: 'candidate',
        updated_at: new Date(),
      },
      include: {
        candidate_work_exps: { where: { deleted_at: null } },
        candidate_skills: { where: { deleted_at: null } },
        candidate_webinars: { where: { deleted_at: null } },
        candidate_programs: {},
        admin_candidate: {
          where: { deleted_at: null },
          select: {
            id_admin: true,
            admins: { select: { id: true, email: true, name: true } }, // adjust alias if needed
          },
        },
      },
    });

    return stripSensitive(updated);
  }

  async update(id: string, dto: any, actorId?: string) {
    if ('password' in dto) {
      const { password, ...rest } = dto;
      dto = rest;
    }

    const exists = await this.prisma.candidates.findFirst({
      where: { id, deleted_at: null },
      select: { id: true },
    });
    if (!exists)
      throw new NotFoundException({ code: 'CANDIDATE_NOT_FOUND', details: id });

    const updated = await this.prisma.candidates.update({
      where: { id },
      data: {
        ...dto,
        updated_by: actorId ?? '',
        updated_at: new Date(),
      },
      include: {
        candidate_work_exps: { where: { deleted_at: null } },
        candidate_skills: { where: { deleted_at: null } },
        candidate_webinars: { where: { deleted_at: null } },
        candidate_programs: {},
        admin_candidate: {
          where: { deleted_at: null },
          select: {
            id_admin: true,
            admins: { select: { id: true, email: true, name: true } }, // adjust alias if needed
          },
        },
      },
    });

    return stripSensitive(updated);
  }

  async softDelete(id: string, actorId?: string) {
    const exists = await this.prisma.candidates.findFirst({
      where: { id, deleted_at: null },
      select: { id: true },
    });
    if (!exists)
      throw new NotFoundException({ code: 'CANDIDATE_NOT_FOUND', details: id });

    await this.prisma.candidates.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by: actorId ?? '',
      },
      select: { id: true },
    });

    return { deleted: true, id };
  }

  // ---------- Skills ----------
  async addSkill(candidateId: string, dto: any) {
    await this.ensureCandidate(candidateId);

    const created = await this.prisma.candidate_skills.create({
      data: {
        // FK via relation connect (NOT id_candidate)
        candidates: { connect: { id: candidateId } },
        name: dto.name ?? '',
        tag: dto.tag ?? '',
        certificate: dto.certificate ?? '',
        level: dto.level ?? '',
        issue_date: dto.issue_date ? new Date(dto.issue_date) : null,
        is_verified: dto.is_verified ?? false,
        status: dto.status ?? '',
        created_at: new Date(),
      } as any,
      select: {
        id: true,
        name: true,
        tag: true,
        certificate: true,
        level: true,
        issue_date: true,
        is_verified: true,
        status: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
      },
    });

    return { ...created, id: created.id.toString() };
  }

  async updateSkill(candidateId: string, skillId: string, dto: any) {
    await this.ensureCandidate(candidateId);

    // ensure belongs to candidate & not soft-deleted (relation filter)
    const existing = await this.prisma.candidate_skills.findFirst({
      where: {
        id: BigInt(skillId),
        deleted_at: null,
        candidates: { is: { id: candidateId } },
      },
      select: { id: true },
    });
    if (!existing)
      throw new NotFoundException({
        code: 'CANDIDATE_SKILL_NOT_FOUND',
        details: { candidateId, skillId },
      });

    const updated = await this.prisma.candidate_skills.update({
      where: { id: BigInt(skillId) },
      data: {
        ...dto,
        issue_date: dto.issue_date ? new Date(dto.issue_date) : undefined,
        updated_at: new Date(),
        // no updated_by column
      } as any,
      select: {
        id: true,
        name: true,
        tag: true,
        certificate: true,
        level: true,
        issue_date: true,
        is_verified: true,
        status: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
      },
    });

    return { ...updated, id: updated.id.toString() };
  }

  async deleteSkill(candidateId: string, skillId: string) {
    await this.ensureCandidate(candidateId);

    const existing = await this.prisma.candidate_skills.findFirst({
      where: {
        id: BigInt(skillId),
        deleted_at: null,
        candidates: { is: { id: candidateId } },
      },
      select: { id: true },
    });
    if (!existing)
      throw new NotFoundException({
        code: 'CANDIDATE_SKILL_NOT_FOUND',
        details: { candidateId, skillId },
      });

    await this.prisma.candidate_skills.update({
      where: { id: BigInt(skillId) },
      data: {
        deleted_at: new Date(),
        // no deleted_by column
      } as any,
      select: { id: true },
    });

    return { deleted: true, id: skillId };
  }

  // ---------- Working Experience ----------
  async addWorkExp(candidateId: string, dto: any) {
    await this.ensureCandidate(candidateId);
    const created = await this.prisma.candidate_work_exps.create({
      data: {
        candidates: { connect: { id: candidateId } }, // connect instead of id_candidate
        company: dto.company ?? '',
        occupation: dto.occupation ?? '',
        industry: dto.industry ?? '',
        start_year: dto.start_year ?? '',
        start_month: dto.start_month ?? '',
        end_year: dto.end_year ?? '',
        end_month: dto.end_month ?? '',
        so: dto.so ?? '',
        description: dto.description ?? '',
        certificate: dto.certificate ?? '',
        certificate_test: dto.certificate_test ?? '',
        is_verified: dto.is_verified ?? false,
        field: dto.field ?? '',
        tag: dto.tag ?? '',
        status: dto.status ?? '',
        created_at: new Date(),
      } as any,
      select: {
        id: true,
        company: true,
        occupation: true,
        industry: true,
        start_year: true,
        start_month: true,
        end_year: true,
        end_month: true,
        so: true,
        description: true,
        certificate: true,
        certificate_test: true,
        is_verified: true,
        field: true,
        tag: true,
        status: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
      },
    });

    return { ...created, id: created.id.toString() };
  }

  async updateWorkExp(candidateId: string, workId: string, dto: any) {
    await this.ensureCandidate(candidateId);

    const existing = await this.prisma.candidate_work_exps.findFirst({
      where: {
        id: BigInt(workId),
        deleted_at: null,
        candidates: { is: { id: candidateId } },
      },
      select: { id: true },
    });
    if (!existing)
      throw new NotFoundException({
        code: 'CANDIDATE_WORK_EXP_NOT_FOUND',
        details: { candidateId, workId },
      });

    const updated = await this.prisma.candidate_work_exps.update({
      where: { id: BigInt(workId) },
      data: {
        ...dto,
        updated_at: new Date(),
      } as any,
      select: {
        id: true,
        company: true,
        occupation: true,
        industry: true,
        start_year: true,
        start_month: true,
        end_year: true,
        end_month: true,
        so: true,
        description: true,
        certificate: true,
        certificate_test: true,
        is_verified: true,
        field: true,
        tag: true,
        status: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
      },
    });

    return { ...updated, id: updated.id.toString() };
  }

  async deleteWorkExp(candidateId: string, workId: string) {
    await this.ensureCandidate(candidateId);

    const existing = await this.prisma.candidate_work_exps.findFirst({
      where: {
        id: BigInt(workId),
        deleted_at: null,
        candidates: { is: { id: candidateId } },
      },
      select: { id: true },
    });
    if (!existing)
      throw new NotFoundException({
        code: 'CANDIDATE_WORK_EXP_NOT_FOUND',
        details: { candidateId, workId },
      });

    await this.prisma.candidate_work_exps.update({
      where: { id: BigInt(workId) },
      data: {
        deleted_at: new Date(),
      } as any,
      select: { id: true },
    });

    return { deleted: true, id: workId };
  }

  // ---------- Webinars (attach/detach) ----------
  async attachWebinar(
    candidateId: string,
    webinarId: string,
    actorId?: string,
  ) {
    await this.ensureCandidate(candidateId);

    const link = await this.prisma.candidate_webinars.findFirst({
      where: { id_candidate: candidateId, id_webinar: webinarId },
      select: { id: true, deleted_at: true },
    });

    if (!link) {
      const created = await this.prisma.candidate_webinars.create({
        data: {
          id_candidate: candidateId,
          id_webinar: webinarId,
          created_at: new Date(),
          created_by: actorId ?? '',
        } as any,
        select: {
          id: true,
          id_candidate: true,
          id_webinar: true,
          created_at: true,
          deleted_at: true,
        },
      });
      return { ...created, id: created.id?.toString?.() ?? created.id };
    }

    if (link.deleted_at) {
      const revived = await this.prisma.candidate_webinars.update({
        where: { id: link.id },
        data: {
          deleted_at: null,
          updated_at: new Date(),
          updated_by: actorId ?? '',
        } as any,
        select: {
          id: true,
          id_candidate: true,
          id_webinar: true,
          updated_at: true,
          deleted_at: true,
        },
      });
      return { ...revived, id: revived.id?.toString?.() ?? revived.id };
    }

    return { attached: true, id_candidate: candidateId, id_webinar: webinarId };
  }

  async detachWebinar(
    candidateId: string,
    webinarId: string,
    actorId?: string,
  ) {
    await this.ensureCandidate(candidateId);

    await this.prisma.candidate_webinars.updateMany({
      where: {
        id_candidate: candidateId,
        id_webinar: webinarId,
        deleted_at: null,
      },
      data: { deleted_at: new Date(), deleted_by: actorId ?? '' } as any,
    });

    return { detached: true, id_candidate: candidateId, id_webinar: webinarId };
  }

  // ---------- Vacancies (attach/detach) ----------
  async attachVacancy(
    candidateId: string,
    vacancyId: string,
    actorId?: string,
  ) {
    await this.ensureCandidate(candidateId);

    const link = await this.prisma.candidate_vacancies.findFirst({
      where: { id_candidate: candidateId, vacancy_id: vacancyId },
      select: { id: true, deleted_at: true },
    });

    if (!link) {
      const created = await this.prisma.candidate_vacancies.create({
        data: {
          id_candidate: candidateId,
          vacancy_id: vacancyId,
          created_at: new Date(),
          created_by: actorId ?? '',
        } as any,
        select: {
          id: true,
          id_candidate: true,
          vacancy_id: true,
          created_at: true,
          deleted_at: true,
        },
      });
      return { ...created, id: created.id?.toString?.() ?? created.id };
    }

    if (link.deleted_at) {
      const revived = await this.prisma.candidate_vacancies.update({
        where: { id: link.id },
        data: {
          deleted_at: null,
          updated_at: new Date(),
          updated_by: actorId ?? '',
        } as any,
        select: {
          id: true,
          id_candidate: true,
          vacancy_id: true,
          updated_at: true,
          deleted_at: true,
        },
      });
      return { ...revived, id: revived.id?.toString?.() ?? revived.id };
    }

    return { attached: true, id_candidate: candidateId, vacancy_id: vacancyId };
  }

  async detachVacancy(
    candidateId: string,
    vacancyId: string,
    actorId?: string,
  ) {
    await this.ensureCandidate(candidateId);

    await this.prisma.candidate_vacancies.updateMany({
      where: {
        id_candidate: candidateId,
        vacancy_id: vacancyId,
        deleted_at: null,
      },
      data: { deleted_at: new Date(), deleted_by: actorId ?? '' } as any,
    });

    return { detached: true, id_candidate: candidateId, vacancy_id: vacancyId };
  }

  // // ---------- CandidateProgram ----------
  // async updateCandidateProgram(id: bigint, dto: UpdateCandidateProgramDto, actorId: string) {
  //   const exists = await this.prisma.candidate_programs.findUnique({
  //     where: { id },
  //     select: { id: true },
  //   });
  //   if (!exists) throw new NotFoundException('CANDIDATE_PROGRAM_NOT_FOUND');

  //   const schedule = buildTestSchedule(dto.test_schedule);

  //   const updated = await this.prisma.candidate_programs.update({
  //     where: { id },
  //     data: {
  //       ...(dto.status !== undefined ? { status: dto.status } : {}),
  //       ...(dto.is_mcu !== undefined ? { is_mcu: dto.is_mcu } : {}),
  //       ...(dto.is_agree !== undefined ? { is_agree: dto.is_agree } : {}),
  //       ...(dto.documents !== undefined ? { documents: dto.documents as any } : {}),
  //       ...(dto.payment !== undefined ? { payment: dto.payment as any } : {}),
  //       ...(dto.is_passed_test !== undefined ? { is_passed_test: dto.is_passed_test } : {}),
  //       ...(dto.is_matches_requirement !== undefined ? { is_matches_requirement: dto.is_matches_requirement } : {}),
  //       ...(dto.reject_reason_matches !== undefined ? { reject_reason_matches: dto.reject_reason_matches } : {}),
  //       ...(dto.reject_reason_not_passed !== undefined ? { reject_reason_not_passed: dto.reject_reason_not_passed } : {}),
  //       ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
  //       ...(dto.stage !== undefined ? { stage: dto.stage } : {}),
  //       ...(dto.tags !== undefined ? { tags: dto.tags as any } : {}),
  //       // ...(dto.metadata !== undefined ? { metadata: dto.metadata as any } : {}),
  //       ...(schedule !== undefined ? { test_schedule: schedule } : {}),
  //       // updated_by: actorId,
  //     },
  //     include: { candidates: { select: candidateSelect } },
  //   });

  //   const { candidates, ...cp } = updated as any;
  //   return { ...cp, candidate_data: candidates };
  // }

  // async candidateSelfRegisterProgram(candidateId: string, dto: SelfCreateProgramDto) {
  //   const exists = await this.prisma.candidate_programs.findFirst({
  //     where: { id_candidate: candidateId, id_program: dto.id_program },
  //     select: { id: true },
  //   });
  //   if (exists) throw new ConflictException('ALREADY_JOINED');

  //   const safePayment = stripIsPaid(dto.payment);

  //   const created = await this.prisma.candidate_programs.create({
  //     data: {
  //       id_program: dto.id_program,
  //       id_candidate: candidateId,
  //       status: 'register',
  //       ...(dto.is_agree !== undefined ? { is_agree: dto.is_agree } : {}),
  //       ...(dto.documents !== undefined ? { documents: dto.documents as any } : {}),
  //       ...(safePayment !== undefined ? { payment: safePayment as any } : {}),
  //       ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
  //       ...(dto.stage !== undefined ? { stage: dto.stage } : {}),
  //       ...(dto.tags !== undefined ? { tags: dto.tags as any } : {}),
  //       // ...(dto.metadata !== undefined ? { metadata: dto.metadata as any } : {}),
  //       // created_by: candidateId,
  //     },
  //     include: { candidates: { select: candidateSelect } },
  //   });

  //   const { candidates, ...cp } = created as any;
  //   return { ...cp, candidate_data: candidates };
  // }

  // async candidateSelfUpdateProgram(candidateId: string, id_program: string, dto: SelfUpdateProgramDto) {
  //   const row = await this.prisma.candidate_programs.findFirst({
  //     where: { id_candidate: candidateId, id_program },
  //     select: { id: true, payment: true },
  //   });
  //   if (!row) throw new NotFoundException('CANDIDATE_PROGRAM_NOT_FOUND');

  //   // Deep-merge payment, but ignore is_paid
  //   let mergedPayment: any | undefined = undefined;
  //   if (dto.payment !== undefined) {
  //     const current = (row.payment as any) ?? {};
  //     mergedPayment = deepMerge(current, stripIsPaid(dto.payment));
  //   }

  //   const updated = await this.prisma.candidate_programs.update({
  //     where: { id: row.id },
  //     data: {
  //       ...(dto.is_agree !== undefined ? { is_agree: dto.is_agree } : {}),
  //       ...(dto.documents !== undefined ? { documents: dto.documents as any } : {}),
  //       ...(mergedPayment !== undefined ? { payment: mergedPayment as any } : {}),
  //       ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
  //       ...(dto.stage !== undefined ? { stage: dto.stage } : {}),
  //       ...(dto.tags !== undefined ? { tags: dto.tags as any } : {}),
  //       // ...(dto.metadata !== undefined ? { metadata: dto.metadata as any } : {}),
  //       // updated_by: candidateId,
  //     },
  //     include: { candidates: { select: candidateSelect } },
  //   });

  //   const { candidates, ...cp } = updated as any;
  //   return { ...cp, candidate_data: candidates };
  // }

  // ---------- util ----------
  private async ensureCandidate(id: string) {
    const exists = await this.prisma.candidates.findFirst({
      where: { id, deleted_at: null },
      select: { id: true },
    });
    if (!exists)
      throw new NotFoundException({ code: 'CANDIDATE_NOT_FOUND', details: id });
  }

  //   async check() {
  //   const rawData = await this.prisma.candidates.findMany({
  //   where: {
  //       deleted_at: null,
  //       candidate_programs: {},
  //     },
  //     select: {
  //       email: true,
  //       candidate_programs: {
  //         select: {
  //           id_candidate: true,
  //           id_program: true,
  //           status: true,
  //           created_at: true,
  //           updated_at: true,
  //         },
  //       },
  //     },
  //   });

  // const data = rawData
  //   .map(c => ({
  //     ...c,
  //   }))
  //   .filter(c => c.candidate_programs.length > 0);

  //   // calculate totals
  //   const totalCandidates = data.length;
  //   const totalDocuments = data.reduce(
  //     (sum, c) =>
  //       sum +
  //       c.candidate_programs.reduce(
  //         (sub, p) => sub + (p.documents?.length ?? 0),
  //         0
  //       ),
  //     0
  //   );

  //   return {
  //       totalCandidates,
  //   totalDocuments,
  //   data,
  //   }
  //   }
}
