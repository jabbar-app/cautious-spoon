import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Accept 32 | "32" -> keep as string/number; service will coerce to the right DB type
const idAtom = z.union([z.number(), z.string().trim()]);

export const PatchRolePermissionsSchema = z.object({
  attach: z.array(idAtom).optional().default([]),
  detach: z.array(idAtom).optional().default([]),
}).refine((val) => {
  const A = new Set((val.attach ?? []).map((x) => String(x)));
  return (val.detach ?? []).every((d) => !A.has(String(d)));
}, { message: 'ATTACH_DETACH_OVERLAP' });

export class PatchRolePermissionsDto extends createZodDto(PatchRolePermissionsSchema) {}
export type PatchRolePermissions = z.infer<typeof PatchRolePermissionsSchema>;