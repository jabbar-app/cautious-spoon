import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DeleteFileQuerySchema = z.object({
  path: z.string().min(1, 'path required'),
});

export class DeleteFileQueryDto extends createZodDto(DeleteFileQuerySchema) {}
export type DeleteFileQuery = z.infer<typeof DeleteFileQuerySchema>;
