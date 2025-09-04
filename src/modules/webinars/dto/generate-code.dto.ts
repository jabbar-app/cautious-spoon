import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GenerateCodeSchema = z.object({
  ttlHours: z.number().int().min(1).max(168).optional().default(24), // no throttling as requested
});
export class GenerateCodeDto extends createZodDto(GenerateCodeSchema) {}
export type GenerateCode = z.infer<typeof GenerateCodeSchema>;
