// src/common/dto/list-query.dto.ts
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Handle boolean-ish query strings gracefully: ?all=true|false|1|0
const booleanish = z
  .union([z.boolean(), z.literal('true'), z.literal('false'), z.literal('1'), z.literal('0')])
  .transform((v) => (typeof v === 'boolean' ? v : v === 'true' || v === '1'));

export const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().positive().max(200).default(20),
  search: z.string().trim().min(1).optional(),
  /** e.g. sort=created_at,-email */
  sort: z.string().trim().optional(),
  /** when true → bypass pagination and return all items */
  all: booleanish.default(false).optional(),
  /** when "options" → return lean rows for selects */
  select: z.enum(['options']).optional(),
});

export class ListQueryDto extends createZodDto(ListQuerySchema) {}
export type ListQuery = z.infer<typeof ListQuerySchema>;
