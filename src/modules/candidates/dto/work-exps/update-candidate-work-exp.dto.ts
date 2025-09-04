import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateCandidateWorkExpSchema = z.object({
  company: z.string().trim().optional(),
  occupation: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  start_year: z.string().trim().optional(),
  start_month: z.string().trim().optional(),
  end_year: z.string().trim().optional(),
  end_month: z.string().trim().optional(),
  so: z.string().trim().optional(),
  description: z.string().trim().optional(),
  certificate: z.string().trim().optional(),
  certificate_test: z.string().trim().optional(),
  is_verified: z.boolean().optional(),
  field: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  status: z.string().trim().optional()
}).strict();

export class UpdateCandidateWorkExpDto extends createZodDto(UpdateCandidateWorkExpSchema) {}
export type UpdateCandidateWorkExp = z.infer<typeof UpdateCandidateWorkExpSchema>;
