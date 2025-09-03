import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UploadFileSchema = z.object({
  path: z.string().min(1, 'path required'),
});

export class UploadFileDto extends createZodDto(UploadFileSchema) {}
export type UploadFile = z.infer<typeof UploadFileSchema>;
