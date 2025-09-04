import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListAttendeesSchema = z.object({
  status: z.enum(['register', 'attended']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().min(1).max(100).optional(),
});

export class ListAttendeesQueryDto extends createZodDto(ListAttendeesSchema) {}
export type ListAttendeesQuery = z.infer<typeof ListAttendeesSchema>;
