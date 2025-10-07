import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MigrationsService } from './migration.service';
import { JwtAdminGuard } from '../../common/guards/jwt-admin.guard';
import { RunMigrationDtoSchema } from './dto/run-migration.dto';
import { randomUUID } from 'crypto';

function zodIssuesToFields(
  issues: ReadonlyArray<{ path?: unknown[]; message: string }>,
) {
  const buckets = new Map<string, string[]>();
  for (const i of issues) {
    const key = Array.isArray(i.path)
      ? i.path.map((p) => String(p)).join('.')
      : '_root';
    const arr = buckets.get(key) ?? [];
    arr.push(i.message);
    buckets.set(key, arr);
  }
  return Object.fromEntries(
    Array.from(buckets.entries()).map(([k, v]) => [k, v.join('; ')]),
  );
}

@UseGuards(JwtAdminGuard)
@Controller('migrations')
export class MigrationsController {
  constructor(private readonly svc: MigrationsService) {}

  @Post('run')
  async run(@Body() body: unknown, @Req() req: any) {
    const parsed = RunMigrationDtoSchema.safeParse(body);
    const requestId = randomUUID();
    const timestamp = new Date().toISOString();

    if (!parsed.success) {
      const fields = zodIssuesToFields((parsed as any)?.error?.issues ?? []);
      return {
        success: false,
        message: 'Validation failed',
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          details: 'Invalid payload for migrations/run',
          fields,
        },
        meta: { timestamp, requestId, traceId: null, version: 'v1' },
        pagination: null,
        links: { self: req?.url ?? '/migrations/run', next: null, prev: null },
      };
    }

    const { tables, dryRun, limit, cursors } = parsed.data;
    const report = await this.svc.run({ tables, dryRun, limit, cursors });

    return {
      success: true,
      message: dryRun
        ? 'Dry-run migration chunk completed'
        : 'Migration chunk completed',
      data: report,
      error: null,
      meta: { timestamp, requestId, traceId: null, version: 'v1' },
      pagination: null,
      links: { self: req?.url ?? '/migrations/run', next: null, prev: null },
    };
  }

  @Get('status')
  async status(@Req() req: any) {
    const requestId = randomUUID();
    const timestamp = new Date().toISOString();
    const status = this.svc.getStatus();
    return {
      success: true,
      message: 'Migration status',
      data: status,
      error: null,
      meta: { timestamp, requestId, traceId: null, version: 'v1' },
      pagination: null,
      links: { self: req?.url ?? '/migrations/status', next: null, prev: null },
    };
  }

  @Post(':table')
  async runSingle(
    @Param('table') table: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const requestId = randomUUID();
    const timestamp = new Date().toISOString();

    const dryRun = body?.dryRun !== false; // default true
    const limit = typeof body?.limit === 'number' ? body.limit : 1000;
    const cursors = body?.cursors ?? undefined;

    const report = await this.svc.run({
      tables: [table],
      dryRun,
      limit,
      cursors,
    });

    return {
      success: true,
      message: dryRun
        ? `Dry-run ${table} chunk completed`
        : `${table} chunk completed`,
      data: report,
      error: null,
      meta: { timestamp, requestId, traceId: null, version: 'v1' },
      pagination: null,
      links: {
        self: req?.url ?? `/migrations/${table}`,
        next: null,
        prev: null,
      },
    };
  }
}
