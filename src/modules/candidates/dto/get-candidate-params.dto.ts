import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Candidate IDs in your DB can be varchar/uuid; keep it flexible:
export const GetCandidateParamsSchema = z.object({
  id: z.string().min(1),
});
export class GetCandidateParamsDto extends createZodDto(GetCandidateParamsSchema) {}
export type GetCandidateParams = z.infer<typeof GetCandidateParamsSchema>;
