import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PatchCandidateAdminsSchema = z.object({
  attach: z.array(z.string().min(1)).optional().default([]), // admin IDs to attach
  detach: z.array(z.string().min(1)).optional().default([]), // admin IDs to detach (soft delete)
}).refine((v) => {
  const A = new Set((v.attach ?? []).map(String));
  return (v.detach ?? []).every((id) => !A.has(String(id)));
}, { message: 'ATTACH_DETACH_OVERLAP' });

export class PatchCandidateAdminsDto extends createZodDto(PatchCandidateAdminsSchema) {}
export type PatchCandidateAdmins = z.infer<typeof PatchCandidateAdminsSchema>;
