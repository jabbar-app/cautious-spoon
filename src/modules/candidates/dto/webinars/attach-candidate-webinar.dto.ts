import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AttachCandidateWebinarSchema = z.object({
  webinarId: z.string().min(1)
});
export class AttachCandidateWebinarDto extends createZodDto(AttachCandidateWebinarSchema) {}
export type AttachCandidateWebinar = z.infer<typeof AttachCandidateWebinarSchema>;
