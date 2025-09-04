import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Reuse your paging/sorting convention; allow free-form status since your data shows many values
export const ListParticipantsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().min(1).optional(),
  sort: z.string().optional(),             // e.g., "updated_at,-status"
  all: z.coerce.boolean().optional(),      // true to return all
  status: z.string().min(1).optional(),    // e.g., "attended" | "register" | "passed_test" | "interview" | ...
});

export class ListParticipantsQueryDto extends createZodDto(ListParticipantsSchema) {}
export type ListParticipantsQuery = z.infer<typeof ListParticipantsSchema>;
