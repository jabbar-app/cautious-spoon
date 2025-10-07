
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';


export const SelfCreateProgramSchema = z
  .object({
    id_program: z.string().min(1)
  })
  .strict();

export class SelfCreateProgramDto extends createZodDto(SelfCreateProgramSchema) {}
