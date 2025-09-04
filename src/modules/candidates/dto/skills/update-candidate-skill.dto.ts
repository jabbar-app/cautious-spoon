import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateCandidateSkillSchema = z.object({
  name: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  certificate: z.string().trim().optional(),
  level: z.string().trim().optional(),
  issue_date: z.iso.datetime().optional(),
  is_verified: z.boolean().optional(),
  status: z.string().trim().optional()
}).strict();

export class UpdateCandidateSkillDto extends createZodDto(UpdateCandidateSkillSchema) {}
export type UpdateCandidateSkill = z.infer<typeof UpdateCandidateSkillSchema>;
