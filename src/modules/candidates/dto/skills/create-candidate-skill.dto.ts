import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateCandidateSkillSchema = z.object({
  name: z.string().trim().optional().default(''),
  tag: z.string().trim().optional().default(''),          // e.g., 'JLPT','NAT','JFT','NURSE','BAHASA','OTHER'
  certificate: z.string().trim().optional().default(''),
  level: z.string().trim().optional().default(''),        // e.g., 'N3'
  issue_date: z.iso.datetime().optional(),
  is_verified: z.boolean().optional(),
  status: z.string().trim().optional()
});
export class CreateCandidateSkillDto extends createZodDto(CreateCandidateSkillSchema) {}
export type CreateCandidateSkill = z.infer<typeof CreateCandidateSkillSchema>;