import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateCandidateWorkExpSchema = z.object({
  company: z.string().trim().optional().default(''),
  occupation: z.string().trim().optional().default(''),
  industry: z.string().trim().optional().default(''),   // can be enum/id per your data
  start_year: z.string().trim().optional().default(''),
  start_month: z.string().trim().optional().default(''),
  end_year: z.string().trim().optional().default(''),
  end_month: z.string().trim().optional().default(''),
  so: z.string().trim().optional().default(''),
  description: z.string().trim().optional().default(''),
  certificate: z.string().trim().optional().default(''),
  certificate_test: z.string().trim().optional().default(''),
  is_verified: z.boolean().optional(),
  field: z.string().trim().optional().default(''),
  tag: z.string().trim().optional().default(''),        // e.g., 'SSW-EXP','WORK-EXP','EPA-EXP'
  status: z.string().trim().optional()
});
export class CreateCandidateWorkExpDto extends createZodDto(CreateCandidateWorkExpSchema) {}
export type CreateCandidateWorkExp = z.infer<typeof CreateCandidateWorkExpSchema>;
