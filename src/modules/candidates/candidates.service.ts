import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';
import type { ListCandidates } from './dto/list-candidates.dto';

// helpers split out
import {
  includeRelations,
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

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  async createByAdmin(
    dto: {
      email: string; password: string; name?: string; phone?: string; sex?: string;
      birth_date?: string; address_info?: any; birth_info?: any; document?: any; education?: any;
      marital_status?: string; religion?: string; status?: number; onboarding?: boolean; verified?: any;
      talent_id?: string; owner_admin_ids?: string[];
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
        birth_date: dto.birth_date ? new Date(dto.birth_date) : null,
        status: dto.status ?? 1,
        onboarding: dto.onboarding ?? false,
        verified: dto.verified ?? {},
        talent_id: talentId ?? '',
        created_at: new Date(),
        created_by: actorId ?? '',
      } as Prisma.candidatesCreateInput,
      include: includeRelations,
    });

    // seed owners
    const seed = new Set<string>((dto.owner_admin_ids ?? []).map(String).filter(Boolean));
    if ((!dto.owner_admin_ids || dto.owner_admin_ids.length === 0) && actorType === 'admin' && actorId) {
      seed.add(actorId);
    }
    if (seed.size) {
      await this.setAdminOwnersInternal(created.id, Array.from(seed), [], actorId);
      const fresh = await this.prisma.candidates.findFirst({
        where: { id: created.id },
        include: includeRelations,
      });
      return stripSensitive(fresh);
    }

    return stripSensitive(created);
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
    const where: Prisma.candidatesWhereInput = {
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
    };

    const rows = await this.prisma.candidates.findMany({
      where,
      orderBy: parseSort(q.sort) as any,
      include: includeRelations,
    });

    // ---- normalize incoming filters ----
    const genders = (q.gender ?? []) as string[];
    const bothGendersSelected = genders.includes('male') && genders.includes('female');
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
        const works = Array.isArray(c.candidate_work_exps) ? c.candidate_work_exps : [];
        if (!works.length) return false;

        const matchedWorks = expTags.length ? works.filter((w: any) => workMatchesTags(w, expTags)) : works;
        if (expTags.length && matchedWorks.length === 0) return false;
        if (wantExpCert) {
          const hasCert = matchedWorks.some((w: any) => workHasCertificate(w));
          if (!hasCert) return false;
        }
      }

      // skills / certs
      const skills = Array.isArray(c.candidate_skills) ? c.candidate_skills : [];

      if (certNames.length) {
        const hitAll = certNames.every((name) => skills.some((s) => skillHasName(s, name)));
        if (!hitAll) return false;
      }

      if (jlpt.length) {
        const hit = skills.some((s) => skillHasTag(s, 'JLPT') && skillHasLevel(s, jlpt));
        if (!hit) return false;
      }

      if (nat.length) {
        const hit = skills.some((s) => skillHasTag(s, 'NAT') && skillHasLevel(s, nat));
        if (!hit) return false;
      }

      if (wantJft) {
        const hit = skills.some((s) => skillHasTag(s, 'JFT') || norm(s.name).includes('jft'));
        if (!hit) return false;
      }

      if (wantNurse) {
        const hit = skills.some((s) => skillHasTag(s, 'NURSE') || /nurse|perawat/i.test(s.name ?? ''));
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
      pagination: all ? null : { page, perPage, total, totalPages, nextCursor: null },
    };
  }

  async details(id: string) {
    const row = await this.prisma.candidates.findFirst({
      where: { id, deleted_at: null },
      include: includeRelations,
    });
    if (!row) throw new NotFoundException({ code: 'CANDIDATE_NOT_FOUND', details: id });
    return stripSensitive(row);
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
    if (!exists) throw new NotFoundException({ code: 'CANDIDATE_NOT_FOUND', details: id });

    const updated = await this.prisma.candidates.update({
      where: { id },
      data: {
        ...dto,
        updated_by: actorId ?? '',
        updated_at: new Date(),
      } as Prisma.candidatesUpdateInput,
      include: includeRelations,
    });

    return stripSensitive(updated);
  }

  async softDelete(id: string, actorId?: string) {
    const exists = await this.prisma.candidates.findFirst({
      where: { id, deleted_at: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException({ code: 'CANDIDATE_NOT_FOUND', details: id });

    await this.prisma.candidates.update({
      where: { id },
      data: { deleted_at: new Date(), deleted_by: actorId ?? '' } as Prisma.candidatesUpdateInput,
      select: { id: true },
    });

    return { deleted: true, id };
  }

  // --- ownership (admins ↔ candidates) ---
  async setAdminOwners(candidateId: string, attachIds: string[], detachIds: string[], actorId?: string) {
    const exists = await this.prisma.candidates.findFirst({
      where: { id: candidateId, deleted_at: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException({ code: 'CANDIDATE_NOT_FOUND', details: candidateId });

    await this.setAdminOwnersInternal(candidateId, attachIds, detachIds, actorId);

    const owners = await this.prisma.admin_candidates.findMany({
      where: { id_candidate: candidateId, deleted_at: null },
      select: { id_admin: true, admins: { select: { id: true, email: true, name: true } } },
      orderBy: { id_admin: 'asc' },
    });

    return {
      attached: attachIds.length,
      detached: detachIds.length,
      admins: owners.map((o: any) => o.admins),
    };
  }

  private async setAdminOwnersInternal(candidateId: string, attachIds: string[], detachIds: string[], actorId?: string) {
    const uniq = (arr: string[]) => Array.from(new Set(arr.map(String))).filter(Boolean);
    const attach = uniq(attachIds);
    const detach = uniq(detachIds);

    const union = uniq([...attach, ...detach]);
    if (union.length) {
      const admins = await this.prisma.admins.findMany({
        where: { id: { in: union }, deleted_at: null },
        select: { id: true },
      });
      const ok = new Set(admins.map((a) => a.id));
      attach.splice(0, attach.length, ...attach.filter((id) => ok.has(id)));
      detach.splice(0, detach.length, ...detach.filter((id) => ok.has(id)));
    }

    await this.prisma.$transaction(async (tx) => {
      const links = await tx.admin_candidates.findMany({
        where: { id_candidate: candidateId, id_admin: { in: attach } },
        select: { id_admin: true, deleted_at: true },
      });
      const map = new Map(links.map((l) => [l.id_admin, l.deleted_at]));

      const toCreate: { id_candidate: string; id_admin: string; created_by?: string }[] = [];
      const toRevive: string[] = [];

      for (const id of attach) {
        if (!map.has(id)) toCreate.push({ id_candidate: candidateId, id_admin: id, ...(actorId ? { created_by: actorId } : {}) });
        else if (map.get(id) !== null) toRevive.push(id);
      }

      if (toCreate.length) {
        await tx.admin_candidates.createMany({ data: toCreate, skipDuplicates: true });
      }
      if (toRevive.length) {
        await tx.admin_candidates.updateMany({
          where: { id_candidate: candidateId, id_admin: { in: toRevive } },
          data: { deleted_at: null, updated_at: new Date(), ...(actorId ? { updated_by: actorId } : {}) },
        });
      }

      if (detach.length) {
        await tx.admin_candidates.updateMany({
          where: { id_candidate: candidateId, id_admin: { in: detach }, deleted_at: null },
          data: { deleted_at: new Date(), ...(actorId ? { deleted_by: actorId } : {}) },
        });
      }
    });
  }
}
