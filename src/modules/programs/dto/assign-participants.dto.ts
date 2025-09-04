import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AssignParticipantsSchema = z.object({
  candidateIds: z.array(z.string().min(1)).min(1),
});

export class AssignParticipantsDto extends createZodDto(AssignParticipantsSchema) {}
export type AssignParticipants = z.infer<typeof AssignParticipantsSchema>;
