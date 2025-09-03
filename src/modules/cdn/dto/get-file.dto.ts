import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetFileQuerySchema = z.object({
  path: z.string().min(1, 'path required'),
  redirect: z
    .union([z.boolean(), z.string().trim().toLowerCase().transform(v => v === 'true')])
    .optional()
    .default(false),
});

export class GetFileQueryDto extends createZodDto(GetFileQuerySchema) {}
export type GetFileQuery = z.infer<typeof GetFileQuerySchema>;
