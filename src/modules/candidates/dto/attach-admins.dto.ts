import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AttachAdminsSchema = z.object({
  id_candidate: z.string().min(1),
  attach: z.array(z.string().min(1)).optional().default([]), // admin IDs to attach
  detach: z.array(z.string().min(1)).optional().default([]), // admin IDs to detach (soft delete)
});
export class AttachAdminsDto extends createZodDto(AttachAdminsSchema) {}
export type AttachAdmins = z.infer<typeof AttachAdminsSchema>;
