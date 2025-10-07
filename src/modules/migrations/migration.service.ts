import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { PrismaLegacyService } from '../../core/database/prisma.service';
import { v5 as uuidv5, v4 as uuidv4 } from 'uuid';

type RunOptions = {
  tables?: string[];
  dryRun?: boolean;
  limit?: number;
  cursors?: Record<string, string | number | null | undefined>;
};

type ConflictEntry = {
  table: string;
  reason: string;
  key?: Record<string, any>;
  legacyId?: string | number | null;
};

type MissingLinkEntry = {
  table: string;
  rowId?: string | number | null;
  field: 'industry' | 'occupation' | 'admin' | 'candidate';
  value: any;
};

type TableReport = {
  table: string;
  read: number; // fetched in this chunk
  written: number; // actual DB writes
  planned: number; // dry-run planned writes
  conflicts: ConflictEntry[];
  missingLinks: MissingLinkEntry[];
  errors: Array<{ legacyId?: any; reason: string }>;
  nextCursor: string | number | null; // last processed primary key
  hasMore: boolean;
};

type MigrationReport = {
  dryRun: boolean;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  tables: TableReport[];
  cursors: Record<string, string | number | null>;
  summary: {
    totalRead: number;
    totalWritten: number;
    totalPlanned: number;
    totalConflicts: number;
    totalMissingLinks: number;
    totalErrors: number;
  };
};

type ModelNames = { legacy: string[]; core: string[] };

const DNS_NS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // RFC4122 namespace

function detUuid(
  table: string,
  legacyId: string | number | null | undefined,
): string {
  const val = `${table}:${legacyId ?? ''}`;
  try {
    return uuidv5(val, DNS_NS);
  } catch {
    return uuidv4();
  }
}

function hasCrud(repo: any) {
  return (
    repo &&
    typeof repo.findMany === 'function' &&
    typeof repo.create === 'function'
  );
}

function isP2002(e: any) {
  return e?.code === 'P2002';
}

function buildFindMany(limit: number, cursor: any) {
  const q: any = { orderBy: { id: 'asc' }, take: limit };
  if (cursor !== null && cursor !== undefined) {
    q.cursor = { id: cursor };
    q.skip = 1;
  }
  return q;
}

function trimStrings<T extends Record<string, any>>(obj: T): T {
  const out: any = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === 'string' ? v.trim() : v;
  }
  return out;
}

@Injectable()
export class MigrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly legacy: PrismaLegacyService,
  ) {}

  // Centralized model name map (aliases for legacy)
  private readonly MODEL: Record<string, ModelNames> = {
    industries: {
      legacy: ['industries', 'job_industries'],
      core: ['industries'],
    },
    occupations: {
      legacy: ['occupations', 'job_occupations'],
      core: ['occupations'],
    },
    prefectures: { legacy: ['prefectures'], core: ['prefectures'] },
    provinces: { legacy: ['provinces'], core: ['provinces'] },
    cities: { legacy: ['cities'], core: ['cities'] },
    districts: { legacy: ['districts'], core: ['districts'] },
    sub_districts: { legacy: ['sub_districts'], core: ['sub_districts'] },
    admins: { legacy: ['admins'], core: ['admins'] },
    candidates: { legacy: ['candidates'], core: ['candidates'] },
    candidate_work_exps: {
      legacy: ['candidate_work_exps'],
      core: ['candidate_work_exps'],
    },
    candidate_skills: {
      legacy: ['candidate_skills'],
      core: ['candidate_skills'],
    },
    // NOTE: intentionally NO 'locations' or 'admin_candidate'
  };

  // id maps (per-run)
  private adminIdMap = new Map<string, string>();
  private candidateIdMap = new Map<string, string>();
  private industryIdMap = new Map<string, string>();
  private occupationIdMap = new Map<string, string>();

  // simple in-memory status
  private status = {
    running: false as boolean,
    currentTable: null as string | null,
    startedAt: null as string | null,
    lastCursor: null as { table: string; cursor: any } | null,
  };

  getStatus() {
    return { ...this.status };
  }

  // Resolve a model key or any alias safely
  private getModelNames(modelKey: string): ModelNames {
    const direct = this.MODEL[modelKey];
    if (direct) return direct;
    for (const [, v] of Object.entries(this.MODEL)) {
      if (v.core.includes(modelKey) || v.legacy.includes(modelKey)) return v;
    }
    throw new Error(
      `Unknown model key "${modelKey}". Known keys: ${Object.keys(this.MODEL).join(', ')}. ` +
        `Add legacy/core aliases in MODEL if needed.`,
    );
  }

  private getRepo(client: any, candidates: string[], label: string) {
    for (const name of candidates) {
      const repo = client[name];
      if (hasCrud(repo)) return repo;
    }
    throw new Error(
      `Model repo not found: ${label}. Tried: ${candidates.join(', ')}`,
    );
  }

  // Expand dependencies so id-maps exist
  private expandTables(input: string[]): string[] {
    const deps: Record<string, string[]> = {
      occupations: ['industries'],
      candidate_work_exps: ['candidates', 'industries', 'occupations'],
      candidate_skills: ['candidates', 'industries', 'occupations'],
      // admins/candidates have no deps
      // geography has no deps
    };
    const seen = new Set<string>();
    const visit = (t: string) => {
      if (seen.has(t)) return;
      seen.add(t);
      (deps[t] ?? []).forEach(visit);
    };
    input.forEach(visit);
    return Array.from(seen);
  }

  // ---------- main run ----------

  async run(opts: RunOptions): Promise<MigrationReport> {
    if (this.status.running) {
      throw new Error(
        'A migration run is already in progress. Check /migrations/status',
      );
    }

    const startedAt = new Date();
    const dryRun = opts.dryRun !== false;
    const limit = opts.limit ?? 1000;

    const baseTables = (
      opts.tables?.length
        ? opts.tables
        : [
            'industries',
            'occupations',
            'prefectures',
            'provinces',
            'cities',
            'districts',
            'sub_districts',
            'admins',
            'candidates',
            'candidate_work_exps',
            'candidate_skills',
          ]
    ).map((t) => t.toLowerCase());

    const targetTables = this.expandTables(baseTables);

    // reset per-run
    this.adminIdMap.clear();
    this.candidateIdMap.clear();
    this.industryIdMap.clear();
    this.occupationIdMap.clear();

    this.status = {
      running: true,
      currentTable: null,
      startedAt: startedAt.toISOString(),
      lastCursor: null,
    };

    const reports: TableReport[] = [];
    const cursorsOut: Record<string, string | number | null> = {};

    try {
      const order = [
        'industries',
        'occupations',
        'prefectures',
        'provinces',
        'cities',
        'districts',
        'sub_districts',
        'admins',
        'candidates',
        'candidate_work_exps',
        'candidate_skills',
      ].filter((t) => targetTables.includes(t));

      for (const table of order) {
        this.status.currentTable = table;
        const cursor = opts.cursors?.[table] ?? null;

        let rep: TableReport;
        switch (table) {
          case 'industries':
            rep = await this.migrateIndustries(dryRun, limit, cursor);
            break;
          case 'occupations':
            rep = await this.migrateOccupations(dryRun, limit, cursor);
            break;
          case 'prefectures':
          case 'provinces':
          case 'cities':
          case 'districts':
          case 'sub_districts':
            rep = await this.copyAsIsKey(table, dryRun, limit, cursor);
            break;
          case 'admins':
            rep = await this.migrateAdmins(dryRun, limit, cursor);
            break;
          case 'candidates':
            rep = await this.migrateCandidates(dryRun, limit, cursor);
            break;
          case 'candidate_work_exps':
            rep = await this.migrateCandidateWorkExps(dryRun, limit, cursor);
            break;
          case 'candidate_skills':
            rep = await this.migrateCandidateSkills(dryRun, limit, cursor);
            break;
          default:
            continue;
        }

        reports.push(rep);
        cursorsOut[table] = rep.nextCursor;
        this.status.lastCursor = { table, cursor: rep.nextCursor };
      }
    } finally {
      this.status.running = false;
      this.status.currentTable = null;
    }

    const endedAt = new Date();
    const summary = reports.reduce(
      (acc, r) => {
        acc.totalRead += r.read;
        acc.totalWritten += r.written;
        acc.totalPlanned += r.planned;
        acc.totalConflicts += r.conflicts.length;
        acc.totalMissingLinks += r.missingLinks.length;
        acc.totalErrors += r.errors.length;
        return acc;
      },
      {
        totalRead: 0,
        totalWritten: 0,
        totalPlanned: 0,
        totalConflicts: 0,
        totalMissingLinks: 0,
        totalErrors: 0,
      },
    );

    return {
      dryRun,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      durationMs: endedAt.getTime() - startedAt.getTime(),
      tables: reports,
      cursors: cursorsOut,
      summary,
    };
  }

  // ---------- lookups ----------

  private async migrateIndustries(
    dryRun: boolean,
    limit: number,
    cursor: any,
  ): Promise<TableReport> {
    const { legacy, core } = this.getModelNames('industries');
    const L = this.getRepo(this.legacy as any, legacy, 'legacy.industries');
    const C = this.getRepo(this.prisma as any, core, 'core.industries');

    const report: TableReport = {
      table: 'industries',
      read: 0,
      written: 0,
      planned: 0,
      conflicts: [],
      missingLinks: [],
      errors: [],
      nextCursor: cursor ?? null,
      hasMore: false,
    };

    const rows = await L.findMany(buildFindMany(limit, cursor));
    const filtered = rows.filter((r: any) => !r?.deleted_at);
    report.read = filtered.length;
    if (!filtered.length) return report;

    for (const r of filtered) {
      const legacyId = r.id ?? r.legacy_id ?? null;
      const newId = detUuid('industries', legacyId);
      this.industryIdMap.set(String(legacyId), newId);

      const data = trimStrings({ ...r, id: newId });

      if (dryRun) {
        report.planned++;
        report.nextCursor = r.id ?? report.nextCursor;
        continue;
      }

      try {
        await C.create({ data });
        report.written++;
      } catch (e: any) {
        if (isP2002(e)) {
          try {
            await C.update({ where: { id: newId }, data });
            report.conflicts.push({
              table: 'industries',
              reason: 'Duplicate existed; updated',
              legacyId,
              key: { id: newId },
            });
          } catch (e2: any) {
            report.errors.push({
              legacyId,
              reason: e2?.message ?? 'Update failed',
            });
          }
        } else {
          report.errors.push({
            legacyId,
            reason: e?.message ?? 'Unknown error',
          });
        }
      }

      report.nextCursor = r.id ?? report.nextCursor;
    }

    report.hasMore = rows.length === limit;
    return report;
  }

  private async migrateOccupations(
    dryRun: boolean,
    limit: number,
    cursor: any,
  ): Promise<TableReport> {
    const { legacy, core } = this.getModelNames('occupations');
    const L = this.getRepo(this.legacy as any, legacy, 'legacy.occupations');
    const C = this.getRepo(this.prisma as any, core, 'core.occupations');

    const report: TableReport = {
      table: 'occupations',
      read: 0,
      written: 0,
      planned: 0,
      conflicts: [],
      missingLinks: [],
      errors: [],
      nextCursor: cursor ?? null,
      hasMore: false,
    };

    const rows = await L.findMany(buildFindMany(limit, cursor));
    const filtered = rows.filter((r: any) => !r?.deleted_at);
    report.read = filtered.length;
    if (!filtered.length) return report;

    for (const r of filtered) {
      const legacyId = r.id ?? r.legacy_id ?? null;
      const newId = detUuid('occupations', legacyId);
      this.occupationIdMap.set(String(legacyId), newId);

      const legInd =
        r.id_industry ??
        r.industry_id ??
        r.industry ??
        r.id_job_industry ??
        r.id_job_indsutry ?? // legacy typo seen before
        null;

      let mappedIndustry: string | null = null;
      if (legInd != null) {
        const m = this.industryIdMap.get(String(legInd));
        if (m) mappedIndustry = m;
        else
          report.missingLinks.push({
            table: 'occupations',
            rowId: legacyId,
            field: 'industry',
            value: legInd,
          });
      }

      const data = trimStrings({
        ...r,
        id: newId,
        ...(mappedIndustry && {
          id_industry: mappedIndustry,
          industry: mappedIndustry,
        }),
      });

      if (dryRun) {
        report.planned++;
        report.nextCursor = r.id ?? report.nextCursor;
        continue;
      }

      try {
        await C.create({ data });
        report.written++;
      } catch (e: any) {
        if (isP2002(e)) {
          try {
            await C.update({ where: { id: newId }, data });
            report.conflicts.push({
              table: 'occupations',
              reason: 'Duplicate existed; updated',
              legacyId,
              key: { id: newId },
            });
          } catch (e2: any) {
            report.errors.push({
              legacyId,
              reason: e2?.message ?? 'Update failed',
            });
          }
        } else {
          report.errors.push({
            legacyId,
            reason: e?.message ?? 'Unknown error',
          });
        }
      }

      report.nextCursor = r.id ?? report.nextCursor;
    }

    report.hasMore = rows.length === limit;
    return report;
  }

  // ---------- geography copy-as-is (no id conversion) ----------

  private async copyAsIsKey(
    modelKey: string,
    dryRun: boolean,
    limit: number,
    cursor: any,
  ): Promise<TableReport> {
    const { legacy, core } = this.getModelNames(modelKey);
    const L = this.getRepo(this.legacy as any, legacy, `legacy.${modelKey}`);
    const C = this.getRepo(this.prisma as any, core, `core.${modelKey}`);

    const report: TableReport = {
      table: modelKey,
      read: 0,
      written: 0,
      planned: 0,
      conflicts: [],
      missingLinks: [],
      errors: [],
      nextCursor: cursor ?? null,
      hasMore: false,
    };

    const rows = await L.findMany(buildFindMany(limit, cursor));
    const filtered = rows.filter(
      (r: any) => !('deleted_at' in r) || !r.deleted_at,
    );
    report.read = filtered.length;
    if (!filtered.length) return report;

    for (const r of filtered) {
      const data = trimStrings({ ...r });

      if (dryRun) {
        report.planned++;
        report.nextCursor = r.id ?? report.nextCursor;
        continue;
      }

      try {
        await C.create({ data });
        report.written++;
      } catch (e: any) {
        if (isP2002(e)) {
          try {
            await C.update({ where: { id: r.id }, data });
            report.conflicts.push({
              table: modelKey,
              reason: 'Duplicate existed; updated',
              legacyId: r.id,
              key: { id: r.id },
            });
          } catch (e2: any) {
            report.errors.push({
              legacyId: r.id,
              reason: e2?.message ?? 'Update failed',
            });
          }
        } else {
          report.errors.push({
            legacyId: r.id,
            reason: e?.message ?? 'Unknown error',
          });
        }
      }

      report.nextCursor = r.id ?? report.nextCursor;
    }

    report.hasMore = rows.length === limit;
    return report;
  }

  // ---------- accounts ----------

  private async migrateAdmins(
    dryRun: boolean,
    limit: number,
    cursor: any,
  ): Promise<TableReport> {
    const { legacy, core } = this.getModelNames('admins');
    const L = this.getRepo(this.legacy as any, legacy, 'legacy.admins');
    const C = this.getRepo(this.prisma as any, core, 'core.admins');

    const report: TableReport = {
      table: 'admins',
      read: 0,
      written: 0,
      planned: 0,
      conflicts: [],
      missingLinks: [],
      errors: [],
      nextCursor: cursor ?? null,
      hasMore: false,
    };

    const rows = await L.findMany(buildFindMany(limit, cursor));
    const filtered = rows.filter((r: any) => !r?.deleted_at);
    report.read = filtered.length;
    if (!filtered.length) return report;

    for (const r of filtered) {
      const legacyId = r.id ?? r.legacy_id ?? r.uuid ?? null;
      const newId = detUuid('admins', legacyId);
      const data = trimStrings({ ...r, id: newId });

      // build multiple identity keys for map
      const ids = [r.id, r.uuid, r.legacy_id].filter(Boolean).map(String);

      if (dryRun) {
        ids.forEach((k) => this.adminIdMap.set(k, newId));
        report.planned++;
        report.nextCursor = r.id ?? report.nextCursor;
        continue;
      }

      try {
        if (r.email) {
          const existingByEmail = await C.findUnique({
            where: { email: r.email },
          });
          if (existingByEmail) {
            ids.forEach((k) => this.adminIdMap.set(k, existingByEmail.id));
            report.conflicts.push({
              table: 'admins',
              reason: 'Duplicate (email)',
              legacyId,
              key: { email: r.email },
            });
            report.nextCursor = r.id ?? report.nextCursor;
            continue;
          }
        }

        await C.create({ data });
        this.adminIdMap.set(String(legacyId), newId);
        ids.forEach((k) => this.adminIdMap.set(k, newId));
        report.written++;
      } catch (e: any) {
        if (isP2002(e)) {
          try {
            await C.update({ where: { id: newId }, data });
            report.conflicts.push({
              table: 'admins',
              reason: 'Duplicate existed; updated',
              legacyId,
              key: { id: newId },
            });
            ids.forEach((k) => this.adminIdMap.set(k, newId));
          } catch (e2: any) {
            report.errors.push({
              legacyId,
              reason: e2?.message ?? 'Update failed',
            });
          }
        } else {
          report.errors.push({
            legacyId,
            reason: e?.message ?? 'Unknown error',
          });
        }
      }

      report.nextCursor = r.id ?? report.nextCursor;
    }

    report.hasMore = rows.length === limit;
    return report;
  }

  private async migrateCandidates(
    dryRun: boolean,
    limit: number,
    cursor: any,
  ): Promise<TableReport> {
    const { legacy, core } = this.getModelNames('candidates');
    const L = this.getRepo(this.legacy as any, legacy, 'legacy.candidates');
    const C = this.getRepo(this.prisma as any, core, 'core.candidates');

    const report: TableReport = {
      table: 'candidates',
      read: 0,
      written: 0,
      planned: 0,
      conflicts: [],
      missingLinks: [],
      errors: [],
      nextCursor: cursor ?? null,
      hasMore: false,
    };

    const rows = await L.findMany(buildFindMany(limit, cursor));
    const filtered = rows.filter((r: any) => !r?.deleted_at);
    report.read = filtered.length;
    if (!filtered.length) return report;

    for (const r of filtered) {
      const legacyId = r.id ?? r.uuid ?? r.legacy_id ?? r.id_candidate ?? null;
      const newId = detUuid('candidates', legacyId);

      const data = trimStrings({ ...r, id: newId });

      const ids = [r.id, r.uuid, r.legacy_id, r.id_candidate, r.external_id]
        .filter(Boolean)
        .map(String);

      if (dryRun) {
        ids.forEach((k) => this.candidateIdMap.set(k, newId));
        report.planned++;
        report.nextCursor = r.id ?? report.nextCursor;
        continue;
      }

      try {
        if (r.email) {
          const existingByEmail = await C.findUnique({
            where: { email: r.email },
          });
          if (existingByEmail) {
            ids.forEach((k) => this.candidateIdMap.set(k, existingByEmail.id));
            report.conflicts.push({
              table: 'candidates',
              reason: 'Duplicate (email)',
              legacyId,
              key: { email: r.email },
            });
            report.nextCursor = r.id ?? report.nextCursor;
            continue;
          }
        }

        await C.create({ data });
        ids.forEach((k) => this.candidateIdMap.set(k, newId));
        report.written++;
      } catch (e: any) {
        if (isP2002(e)) {
          try {
            await C.update({ where: { id: newId }, data });
            report.conflicts.push({
              table: 'candidates',
              reason: 'Duplicate existed; updated',
              legacyId,
              key: { id: newId },
            });
            ids.forEach((k) => this.candidateIdMap.set(k, newId));
          } catch (e2: any) {
            report.errors.push({
              legacyId,
              reason: e2?.message ?? 'Update failed',
            });
          }
        } else {
          report.errors.push({
            legacyId,
            reason: e?.message ?? 'Unknown error',
          });
        }
      }

      report.nextCursor = r.id ?? report.nextCursor;
    }

    report.hasMore = rows.length === limit;
    return report;
  }

  // ---------- candidate details ----------

  private async migrateCandidateWorkExps(
    dryRun: boolean,
    limit: number,
    cursor: any,
  ): Promise<TableReport> {
    const { legacy, core } = this.getModelNames('candidate_work_exps');
    const L = this.getRepo(
      this.legacy as any,
      legacy,
      'legacy.candidate_work_exps',
    );
    const C = this.getRepo(
      this.prisma as any,
      core,
      'core.candidate_work_exps',
    );

    const report: TableReport = {
      table: 'candidate_work_exps',
      read: 0,
      written: 0,
      planned: 0,
      conflicts: [],
      missingLinks: [],
      errors: [],
      nextCursor: cursor ?? null,
      hasMore: false,
    };

    const rows = await L.findMany(buildFindMany(limit, cursor));
    const filtered = rows.filter((r: any) => !r?.deleted_at);
    report.read = filtered.length;
    if (!filtered.length) return report;

    for (const r of filtered) {
      const legacyId = r.id ?? r.legacy_id ?? null;
      const newId = detUuid('candidate_work_exps', legacyId);

      const legCand = r.id_candidate ?? r.candidate_id ?? r.candidate ?? null;
      const mappedCandidate = legCand
        ? this.candidateIdMap.get(String(legCand))
        : null;
      if (!mappedCandidate) {
        report.missingLinks.push({
          table: 'candidate_work_exps',
          rowId: legacyId,
          field: 'candidate',
          value: legCand,
        });
      }

      const legInd = r.industry ?? r.id_industry ?? r.industry_id ?? null;
      const legOcc = r.occupation ?? r.id_occupation ?? r.occupation_id ?? null;

      const mappedIndustry =
        legInd != null
          ? (this.industryIdMap.get(String(legInd)) ?? null)
          : null;
      let mappedOccupation =
        legOcc != null
          ? (this.occupationIdMap.get(String(legOcc)) ?? null)
          : null;

      if (legInd != null && !mappedIndustry) {
        report.missingLinks.push({
          table: 'candidate_work_exps',
          rowId: legacyId,
          field: 'industry',
          value: legInd,
        });
      }
      if (legOcc != null && !mappedOccupation) {
        report.missingLinks.push({
          table: 'candidate_work_exps',
          rowId: legacyId,
          field: 'occupation',
          value: legOcc,
        });
        mappedOccupation = null; // per requirement: skip mismatched occupations
      }

      const data = trimStrings({
        ...r,
        id: newId,
        ...(mappedCandidate && {
          id_candidate: mappedCandidate,
          candidate: mappedCandidate,
        }),
        ...(mappedIndustry && {
          industry: mappedIndustry,
          id_industry: mappedIndustry,
        }),
        ...(mappedOccupation && {
          occupation: mappedOccupation,
          id_occupation: mappedOccupation,
        }),
      });

      if (dryRun) {
        report.planned++;
        report.nextCursor = r.id ?? report.nextCursor;
        continue;
      }

      try {
        await C.create({ data });
        report.written++;
      } catch (e: any) {
        if (isP2002(e)) {
          try {
            await C.update({ where: { id: newId }, data });
            report.conflicts.push({
              table: 'candidate_work_exps',
              reason: 'Duplicate existed; updated',
              legacyId,
              key: { id: newId },
            });
          } catch (e2: any) {
            report.errors.push({
              legacyId,
              reason: e2?.message ?? 'Update failed',
            });
          }
        } else {
          report.errors.push({
            legacyId,
            reason: e?.message ?? 'Unknown error',
          });
        }
      }

      report.nextCursor = r.id ?? report.nextCursor;
    }

    report.hasMore = rows.length === limit;
    return report;
  }

  private async migrateCandidateSkills(
    dryRun: boolean,
    limit: number,
    cursor: any,
  ): Promise<TableReport> {
    const { legacy, core } = this.getModelNames('candidate_skills');
    const L = this.getRepo(
      this.legacy as any,
      legacy,
      'legacy.candidate_skills',
    );
    const C = this.getRepo(this.prisma as any, core, 'core.candidate_skills');

    const report: TableReport = {
      table: 'candidate_skills',
      read: 0,
      written: 0,
      planned: 0,
      conflicts: [],
      missingLinks: [],
      errors: [],
      nextCursor: cursor ?? null,
      hasMore: false,
    };

    const rows = await L.findMany(buildFindMany(limit, cursor));
    const filtered = rows.filter((r: any) => !r?.deleted_at);
    report.read = filtered.length;
    if (!filtered.length) return report;

    for (const r of filtered) {
      const legacyId = r.id ?? r.legacy_id ?? null;
      const newId = detUuid('candidate_skills', legacyId);

      const legCand = r.id_candidate ?? r.candidate_id ?? r.candidate ?? null;
      const mappedCandidate = legCand
        ? this.candidateIdMap.get(String(legCand))
        : null;
      if (!mappedCandidate) {
        report.missingLinks.push({
          table: 'candidate_skills',
          rowId: legacyId,
          field: 'candidate',
          value: legCand,
        });
      }

      const legInd = r.industry ?? r.id_industry ?? r.industry_id ?? null;
      const legOcc = r.occupation ?? r.id_occupation ?? r.occupation_id ?? null;

      const mappedIndustry =
        legInd != null
          ? (this.industryIdMap.get(String(legInd)) ?? null)
          : null;
      let mappedOccupation =
        legOcc != null
          ? (this.occupationIdMap.get(String(legOcc)) ?? null)
          : null;

      if (legInd != null && !mappedIndustry) {
        report.missingLinks.push({
          table: 'candidate_skills',
          rowId: legacyId,
          field: 'industry',
          value: legInd,
        });
      }
      if (legOcc != null && !mappedOccupation) {
        report.missingLinks.push({
          table: 'candidate_skills',
          rowId: legacyId,
          field: 'occupation',
          value: legOcc,
        });
        mappedOccupation = null;
      }

      const data = trimStrings({
        ...r,
        id: newId,
        ...(mappedCandidate && {
          id_candidate: mappedCandidate,
          candidate: mappedCandidate,
        }),
        ...(mappedIndustry && {
          industry: mappedIndustry,
          id_industry: mappedIndustry,
        }),
        ...(mappedOccupation && {
          occupation: mappedOccupation,
          id_occupation: mappedOccupation,
        }),
      });

      if (dryRun) {
        report.planned++;
        report.nextCursor = r.id ?? report.nextCursor;
        continue;
      }

      try {
        await C.create({ data });
        report.written++;
      } catch (e: any) {
        if (isP2002(e)) {
          try {
            await C.update({ where: { id: newId }, data });
            report.conflicts.push({
              table: 'candidate_skills',
              reason: 'Duplicate existed; updated',
              legacyId,
              key: { id: newId },
            });
          } catch (e2: any) {
            report.errors.push({
              legacyId,
              reason: e2?.message ?? 'Update failed',
            });
          }
        } else {
          report.errors.push({
            legacyId,
            reason: e?.message ?? 'Unknown error',
          });
        }
      }

      report.nextCursor = r.id ?? report.nextCursor;
    }

    report.hasMore = rows.length === limit;
    return report;
  }
}
