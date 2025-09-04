import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AttachCandidateVacancySchema = z.object({
  vacancyId: z.string().min(1)
});
export class AttachCandidateVacancyDto extends createZodDto(AttachCandidateVacancySchema) {}
export type AttachCandidateVacancy = z.infer<typeof AttachCandidateVacancySchema>;
