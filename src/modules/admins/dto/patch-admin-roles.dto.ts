import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const idCoerceToBigInt = z.union([z.string(), z.number(), z.bigint()]).transform((v) => {
  try {
    // allow "32", 32, 32n
    return typeof v === 'bigint' ? v : BigInt(v as any);
  } catch {
    throw new Error('INVALID_ROLE_ID');
  }
});

export const PatchAdminRolesSchema = z.object({
  attach: z.array(idCoerceToBigInt).optional().default([]),
  detach: z.array(idCoerceToBigInt).optional().default([]),
})
  // prevent overlapping ids between attach & detach
  .refine((val) => {
    const A = new Set((val.attach ?? []).map((x) => x.toString()));
    return (val.detach ?? []).every((d) => !A.has(d.toString()));
  }, { message: 'ATTACH_DETACH_OVERLAP' });

export class PatchAdminRolesDto extends createZodDto(PatchAdminRolesSchema) {}
export type PatchAdminRoles = z.infer<typeof PatchAdminRolesSchema>;
