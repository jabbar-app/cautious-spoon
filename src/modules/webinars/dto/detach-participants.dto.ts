import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DetachWebinarParticipantsSchema = z.object({
  candidateIds: z.array(z.string().min(1)).min(1),
});

export class DetachWebinarParticipantsDto extends createZodDto(DetachWebinarParticipantsSchema) {}
export type DetachWebinarParticipants = z.infer<typeof DetachWebinarParticipantsSchema>;
