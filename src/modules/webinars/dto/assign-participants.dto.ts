import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AssignWebinarParticipantsSchema = z.object({
  candidateIds: z.array(z.string().min(1)).min(1),
  // keep webinar statuses tight; change union if you allow more
  status: z.enum(['register', 'attended']).optional().default('register'),
});

export class AssignWebinarParticipantsDto extends createZodDto(AssignWebinarParticipantsSchema) {}
export type AssignWebinarParticipants = z.infer<typeof AssignWebinarParticipantsSchema>;
