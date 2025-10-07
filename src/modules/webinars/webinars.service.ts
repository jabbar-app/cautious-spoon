import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { randomUUID } from 'crypto';
import { addHours } from 'date-fns';
import { Prisma } from '@prisma/client';
import { MailerService } from '../../core/mailer/mailer.service';

@Injectable()
export class WebinarsService {
  constructor(private readonly prisma: PrismaService, private readonly mailer: MailerService) {}

  private select = {
    id: true,
    title: true,
    registration_date: true,
    webinar_date: true,
    capacity: true,
    description: true,
    photo: true,
    link: true,
    price: true,
    duration: true,
    speakers: true,
    category: true,
    status: true,
    is_visible: true,
    is_active: true,
    created_at: true,
    updated_at: true,
    deleted_at: true
  } as const;

  private generate6(): string {
    return Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
  }

  // ---------- PROGRAM-AGNOSTIC CRUD ----------

  async create(input: any, adminId:string) {
    const id = input.id ?? randomUUID();
    const now = new Date();
    const row = await this.prisma.webinars.create({
      data: {
        id,
        title: input.title ?? '',
        registration_date: input.registration_date ?? null,
        webinar_date: input.webinar_date ?? null,
        capacity: input.capacity ?? null,
        description: input.description ?? '',
        photo: input.photo ?? '',
        link: input.link ?? '',
        price: input.price ?? null,
        duration: input.duration ?? null,
        speakers: Array.isArray(input.speakers) ? input.speakers : [],
        category: input.category ?? '',
        status: input.status ?? 'upcoming',
        is_visible: input.is_visible ?? true,
        is_active: true,
        created_at: now,
        // updated_at: now,
        created_by: adminId
      },
      select: this.select,
    });
    return row;
  }

  async list(query: any) {
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(query.perPage ?? 20)));
    const search = (query.search ?? '').trim();
    const all = !!query.all;

    const where: Prisma.webinarsWhereInput = {
      deleted_at: null,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.webinarsOrderByWithRelationInput[] = [
      { webinar_date: 'desc' },
      { created_at: 'desc' },
    ];

    if (all) {
      const items = await this.prisma.webinars.findMany({ where, orderBy, select: this.select });
      return { items, page: 1, perPage: items.length, total: items.length, totalPages: 1, nextCursor: null };
    }

    const skip = (page - 1) * perPage;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.webinars.findMany({ where, orderBy, skip, take: perPage, select: this.select }),
      this.prisma.webinars.count({ where }),
    ]);

    return {
      items,
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
      nextCursor: null,
    };
  }

  async detailsById(id_webinar: string) {
    const w = await this.prisma.webinars.findUnique({
      where: { id: id_webinar },
      select: this.select,
    });

    if (!w) throw new NotFoundException('WEBINAR_NOT_FOUND');
    if (w.deleted_at) throw new NotFoundException('WEBINAR_DELETED'); // 3)

    return w;
  }

  async updateById(id_webinar: string, input: any, adminId:string) {
    await this.detailsById(id_webinar);
    return this.prisma.webinars.update({
      where: { id: id_webinar },
      data: { ...input, updated_at: new Date(), updated_by:adminId },
      select: this.select,
    });
  }

  async softDeleteById(id_webinar: string, adminId: string) {
    const w = await this.detailsById(id_webinar);

    await this.prisma.webinars.update({
      where: { id: w.id },
      data: {
        deleted_at: new Date(),         // 2)
        deleted_by: adminId,
        is_active: false,
      },
    });

    return { id_webinar: w.id, deleted: true };
  }

  // ---------- CODE / PARTICIPANTS / BROADCAST (BY WEBINAR) ----------

  async generateCodeById(id_webinar: string, ttlHours = 24) {
    const w = await this.detailsById(id_webinar);
    const code = this.generate6();
    const expiresAt = addHours(new Date(), Math.max(1, Math.min(ttlHours, 168)));

    await this.prisma.webinars.update({
      where: { id: w.id},
      data: {
        updated_at: new Date(),
      },
    });

    return { code, expiresAt };
  }

  async listParticipantsByWebinar(id_webinar: string, query: any) {
    await this.detailsById(id_webinar);

    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(query.perPage ?? 20)));
    const status = (query.status ?? '').trim(); // 'register' | 'attended'
    const search = (query.search ?? '').trim();
    const all = !!query.all;

    // If searching by candidate name/email, resolve candidate ids first:
    let candidateIdFilter: string[] | undefined;
    if (search) {
      const matched = await this.prisma.candidates.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      candidateIdFilter = matched.map(m => m.id);
      if (candidateIdFilter.length === 0) {
        return { items: [], page: 1, perPage: 0, total: 0, totalPages: 1, nextCursor: null };
      }
    }

    const where: Prisma.candidate_webinarsWhereInput = {
      id_webinar,
      deleted_at: null,
      ...(status ? { status } : {}),
      ...(candidateIdFilter ? { id_candidate: { in: candidateIdFilter } } : {}),
    };

    const candidateSelect = {
      id: true,
      name: true,
      email: true,
      phone: true,
      sex: true,
      address_info: true,
    } as const;

    const orderBy: Prisma.candidate_webinarsOrderByWithRelationInput[] = [
      { updated_at: 'desc' },
    ];

    if (all) {
      const rows = await this.prisma.candidate_webinars.findMany({
        where,
        orderBy,
        include: { candidates: { select: candidateSelect } },
      });
      const items = rows.map(r => ({
        ...r.candidates,
        candidate_webinar_id: r.id,
        webinar_status: r.status,
        webinar_joined_at: r.created_at,
        webinar_updated_at: r.updated_at,
      }));
      return { items, page: 1, perPage: items.length, total: items.length, totalPages: 1, nextCursor: null };
    }

    const skip = (page - 1) * perPage;
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.candidate_webinars.count({ where }),
      this.prisma.candidate_webinars.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
        include: { candidates: { select: candidateSelect } },
      }),
    ]);

    const items = rows.map(r => ({
      ...r.candidates,
      candidate_webinar_id: r.id,
      webinar_status: r.status,
      webinar_joined_at: r.created_at,
      webinar_updated_at: r.updated_at,
    }));

    return {
      items,
      page,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
      nextCursor: null,
    };
  }

  async deleteParticipantById(id_candidate_webinar: string) {
    const row = await this.prisma.candidate_webinars.findUnique({
      // id is often BIGINT on this table; adapt if you use string ids
      where: { id: (isNaN(Number(id_candidate_webinar)) ? (id_candidate_webinar as any) : BigInt(id_candidate_webinar)) } as any,
    });
    if (!row) throw new NotFoundException('WEBINAR_PARTICIPANT_NOT_FOUND');

    await this.prisma.candidate_webinars.update({
      where: { id: row.id },
      data: { deleted_at: new Date(), updated_at: new Date() },
    });
    return { id_candidate_webinar, deleted: true };
  }

  async broadcastByWebinar(id_webinar: string) {
    const w = await this.detailsById(id_webinar);
    // Extend to actually send emails if needed
    return { id_webinar: w.id, broadcast: 'ok' };
  }

  // ---------- ASSIGNMENT (still under programs route) ----------


  async assignParticipants(id_webinar: string, candidateIds: string[], status: 'register' | 'attended' = 'register') {
    // if (!candidateIds?.length) throw new BadRequestException('NO_CANDIDATES_TO_ASSIGN');

    if (!candidateIds?.length) {
        throw new BadRequestException({ code: 'NO_CANDIDATES_TO_ASSIGN' });
      }
    // ensure webinar exists and not deleted
    await this.detailsById(id_webinar);

    // fetch existing links in one shot
    const existing = await this.prisma.candidate_webinars.findMany({
      where: { id_webinar, id_candidate: { in: candidateIds } },
      select: { id: true, id_candidate: true, deleted_at: true },
    });
    const byCandidate = new Map(existing.map(e => [e.id_candidate, e]));

    let created = 0;
    let restored = 0;
    let skipped = 0;

    for (const id_candidate of candidateIds) {
      const found = byCandidate.get(id_candidate);
      if (!found) {
        await this.prisma.candidate_webinars.create({
          data: {
            id_candidate,
            id_webinar,
            status,
            created_at: new Date(),
            updated_at: new Date(),
            deleted_at: null,
          } as any,
        });
        created++;
        continue;
      }

      if (found.deleted_at) {
        await this.prisma.candidate_webinars.update({
          where: { id: found.id },
          data: { deleted_at: null, status, updated_at: new Date() },
        });
        restored++;
      } else {
        skipped++;
      }
    }

    return { createdCount: created, restoredCount: restored, skippedCount: skipped };
  }

  async detachParticipants(
    id_webinar: string,
    candidateIds: string[]
  ) {
    if (!candidateIds?.length) {
      throw new BadRequestException('NO_CANDIDATES_TO_DETACH');
    }

    // ensure webinar exists and not deleted
    await this.detailsById(id_webinar);

    // fetch existing links in one shot
    const existing = await this.prisma.candidate_webinars.findMany({
      where: { id_webinar, id_candidate: { in: candidateIds } },
      select: { id: true, id_candidate: true, deleted_at: true },
    });

    const byCandidate = new Map(existing.map(e => [e.id_candidate, e]));
    let detached = 0;
    let skipped = 0;

    for (const id_candidate of candidateIds) {
      const row = byCandidate.get(id_candidate);
      if (!row) continue; // will be counted as missing below

      if (row.deleted_at) {
        skipped++;
        continue;
      }

      await this.prisma.candidate_webinars.update({
        where: { id: row.id },
        data: {
          deleted_at: new Date(),
          updated_at: new Date(),
        } as any,
      });

      detached++;
    }

    const missing = candidateIds.length - existing.length;
    return { detachedCount: detached, skippedCount: skipped, missingCount: Math.max(0, missing) };
  }
}
