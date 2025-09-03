import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const JsonRecord = z.record(z.string(), z.any()).optional();

export const UpdateCandidateSchema = z.object({
  email: z.email().optional(),
  name: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  sex: z.string().trim().optional(),
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
  // password updates NOT allowed here
}).strict();

export class UpdateCandidateDto extends createZodDto(UpdateCandidateSchema) {}
export type UpdateCandidate = z.infer<typeof UpdateCandidateSchema>;
