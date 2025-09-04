import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { randomUUID } from 'crypto';
import { ListQuery } from '../../common/dto/list-query.dto';
import { parseSort } from '../../common/utils/sort';
import { Prisma } from '@prisma/client';



function orderByForCandidatePrograms(sort?: string,): Prisma.candidate_programsOrderByWithRelationInput[] | undefined {
  if (!sort) return [{ updated_at: 'desc' }];

  // allowed fields on link table
  const linkFields = new Set(['updated_at', 'created_at', 'status', 'id_candidate']);
  // allowed fields on related candidate
  const candFields = new Set(['name', 'email', 'phone']);

  const parts = String(sort)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const out: Prisma.candidate_programsOrderByWithRelationInput[] = [];

  for (const p of parts) {
    const desc = p.startsWith('-');
    const key = desc ? p.slice(1) : p;

    if (linkFields.has(key)) {
      out.push({ [key]: (desc ? 'desc' : 'asc') } as any);
    } else if (candFields.has(key)) {
      // assumes relation on candidate_programs is named "candidates"
      out.push({ candidates: { [key]: (desc ? 'desc' : 'asc') } } as any);
    }
  }

  return out.length ? out : [{ updated_at: 'desc' }];
}

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  private programSelect = {
    id: true,
    title: true,
    registration_date: true,
    program_start_date: true,
    training_centre: true,
    capacity: true,
    description: true,
    photo: true,
    price: true,
    duration: true,
    category: true,
    status: true,
    is_active: true,
    is_visible: true,
    formulir: true,
    test_schedules: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    updated_by: true,
    deleted_at: true,
    deleted_by: true
  } as const;

  async create(input: any, adminId:string) {
    const id = input.id ?? randomUUID();
    const now = new Date();
    const row = await this.prisma.programs.create({
      data: {
        id,
        title: input.title ?? '',
        registration_date: input.registration_date ?? null,
        program_start_date: input.program_start_date ?? null,
        training_centre: input.training_centre ?? '',
        capacity: input.capacity ?? null,
        description: input.description ?? '',
        photo: input.photo ?? '',
        price: input.price ?? null,
        duration: input.duration ?? null,
        category: input.category ?? '',
        status: input.status ?? 'upcoming',
        is_visible: input.is_visible ?? true,
        is_active: true,
        formulir: Array.isArray(input.formulir) ? input.formulir : [],
        test_schedules: Array.isArray(input.test_schedules) ? input.test_schedules : [],
        created_at: now,
        created_by: adminId,
        updated_at: now,
      },
      select: this.programSelect,
    });
    return row;
  }

  async update(id_program: string, input: any, adminId: string) {
    const exists = await this.prisma.programs.findUnique({ where: { id: id_program } });
    console.log(exists)
    if (!exists) throw new NotFoundException('PROGRAM_NOT_FOUND');

    const row = await this.prisma.programs.update({
      where: { id: id_program },
      data: {
        ...input,
        updated_at: new Date(),
        updated_by: adminId
      },
      select: this.programSelect,
    });
    return row;
  }

  async softDelete(id_program: string, adminId: string) {
    const exists = await this.prisma.programs.findUnique({ where: { id: id_program } });
    if (!exists) throw new NotFoundException('PROGRAM_NOT_FOUND');
    if (exists.deleted_at) return { id: id_program, deleted: false };

    // 2) set deleted_at + deleted_by (optionally also is_active=false)
    await this.prisma.programs.update({
      where: { id: id_program },
      data: {
        deleted_at: new Date(),
        deleted_by: adminId,
        is_active: false,
        updated_at: new Date(),
      },
    });

    return { id: id_program, deleted: true };
  }


  async getDetails(id_program: string) {
    const row = await this.prisma.programs.findUnique({
      where: { id: id_program },
      select: this.programSelect,
    });

    if (!row) throw new NotFoundException('PROGRAM_NOT_FOUND');

    // 3) throw if deleted
    if (row.deleted_at) throw new NotFoundException('PROGRAM_DELETED');

    return row;
  }

  async list(query: any) {
    const { page, perPage, search, sort, all, select } = query;

    // 1) only not-deleted rows
    const where: Prisma.programsWhereInput = {
      deleted_at: null, // <— key filter
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = (parseSort(sort) ?? [{ created_at: 'desc' }]) as Prisma.programsOrderByWithRelationInput[];

    if (select === 'options') {
      const items = await this.prisma.programs.findMany({
        where,
        orderBy,
        select: { id: true, title: true, status: true },
      });
      return { items, page: 1, perPage: items.length, total: items.length, totalPages: 1, nextCursor: null };
    }

    if (all) {
      const items = await this.prisma.programs.findMany({ where, orderBy, select: this.programSelect });
      return { items, page: 1, perPage: items.length, total: items.length, totalPages: 1, nextCursor: null };
    }

    const _page = Math.max(1, Number(page ?? 1));
    const _perPage = Math.min(100, Math.max(1, Number(perPage ?? 20)));
    const skip = (_page - 1) * _perPage;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.programs.findMany({ where, orderBy, skip, take: _perPage, select: this.programSelect }),
      this.prisma.programs.count({ where }),
    ]);

    return {
      items,
      page: _page,
      perPage: _perPage,
      total,
      totalPages: Math.ceil(total / _perPage),
      nextCursor: null,
    };
  }


  // Participants (candidate_programs)
  // inside ProgramsService
  async listParticipants(id_program: string, query: any) {
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(query.perPage ?? 20)));
    const search = (query.search ?? '').trim();
    const status = (query.status ?? '').trim(); // e.g., 'register'|'attended'|'passed_test'|...
    const all = !!query.all;

    // 1) If searching by name/email, resolve candidate IDs first
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

    // 2) Build WHERE only with fields that belong to candidate_programs
    const where: Prisma.candidate_programsWhereInput = {
      id_program,
      // deleted_at: null,
      ...(status ? { status } : {}),
      ...(candidateIdFilter ? { id_candidate: { in: candidateIdFilter } } : {}),
    };

    // 3) ORDER BY supports link fields and candidate fields
    const orderBy = orderByForCandidatePrograms(query.sort);

    // candidate fields you want to return
    const candidateSelect = {
      id: true,
      name: true,
      email: true,
      phone: true,
      sex: true,
      talent_id: true,
      address_info: true,
    } as const;

    // 4) Fetch rows (+ candidate include) either ALL or paged
    if (all) {
      const rows = await this.prisma.candidate_programs.findMany({
        where,
        orderBy,
        include: { candidates: { select: candidateSelect } },
      });

      const items = rows.map(r => ({
        ...r.candidates,                 // full candidate data
        candidate_program_id: r.id,      // keep link info if UI needs it
        program_status: r.status,
        program_joined_at: r.created_at,
        program_updated_at: r.updated_at,
      }));

      return {
        items,
        page: 1,
        perPage: items.length,
        total: items.length,
        totalPages: 1,
        nextCursor: null,
      };
    }

    const skip = (page - 1) * perPage;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.candidate_programs.count({ where }),
      this.prisma.candidate_programs.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
        include: { candidates: { select: candidateSelect } },
      }),
    ]);

    const items = rows.map(r => ({
      ...r.candidates,
      candidate_program_id: r.id,
      program_status: r.status,
      program_joined_at: r.created_at,
      program_updated_at: r.updated_at,
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


  async assignParticipants(id_program: string, candidateIds: string[]) {
    if (!candidateIds?.length) throw new BadRequestException('NO_CANDIDATES_TO_ASSIGN');
    const p = await this.prisma.programs.findUnique({ where: { id: id_program } });
    if (!p || p.is_active === false) throw new NotFoundException('PROGRAM_NOT_FOUND');

    let assigned = 0;
    let skipped = 0;
    for (const id_candidate of candidateIds) {
      const exists = await this.prisma.candidate_programs.findFirst({
        where: { id_candidate, id_program },
        select: { id: true },
      });
      if (exists) { skipped++; continue; }
      await this.prisma.candidate_programs.create({
        data: { id_candidate, id_program, status: 'assigned', created_at: new Date(), updated_at: new Date() } as any,
      });
      assigned++;
    }
    return { assignedCount: assigned, skippedCount: skipped };
  }
}
