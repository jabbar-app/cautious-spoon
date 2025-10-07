import { z } from 'zod';

export const RunMigrationDtoSchema = z.object({
  tables: z
    .array(
      z.enum([
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
      ]),
    )
    .optional(),
  dryRun: z.boolean().optional().default(true),
  limit: z.number().int().min(1).max(10000).optional().default(1000),
  // Per-table resume cursors: { "<table>": "<last id processed>" }
  cursors: z
    .record(z.string(), z.union([z.string(), z.number()]).nullable())
    .optional(),
});

export type RunMigrationDto = z.infer<typeof RunMigrationDtoSchema>;
