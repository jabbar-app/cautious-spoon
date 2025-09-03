import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const JsonRecord = z.record(z.string(), z.any()).optional(); // jsonb helpers

export const CreateCandidateAdminSchema = z.object({
  email: z.email(),
  password: z.string().min(8),           // FE provides; we hash
  name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  sex: z.string().trim().optional(),     // matches schema
  birth_date: z.union([z.iso.datetime(), z.string()]).optional(),
  address_info: JsonRecord,
  birth_info: JsonRecord,
  document: JsonRecord,
  education: JsonRecord,
  marital_status: z.string().trim().optional(),
  religion: z.string().trim().optional(),
  status: z.number().int().optional(),
  onboarding: z.boolean().optional(),
  verified: JsonRecord,
  talent_id: z.string().trim().optional(),
  is_active: z.boolean().optional(),     // not in model; harmless if ignored by service
  owner_admin_ids: z.array(z.string().min(1)).optional().default([]),
});

export class CreateCandidateAdminDto extends createZodDto(CreateCandidateAdminSchema) {}
export type CreateCandidateAdmin = z.infer<typeof CreateCandidateAdminSchema>;
