import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateProgramSchema = z.object({
  id: z.string().min(1).optional(), // if omitted, service will generate uuid
  title: z.string().default(''),
  registration_date: z.coerce.date().optional(),
  program_start_date: z.coerce.date().optional(),
  training_centre: z.string().default(''),
  capacity: z.coerce.bigint().optional(),
  description: z.string().default(''),
  photo: z.string().default(''),
  price: z.coerce.bigint().optional(),
  duration: z.coerce.bigint().optional(),
  category: z.string().default(''),
  status: z.string().default('upcoming'),
  is_visible: z.boolean().default(true),
  formulir: z.array(z.string()).default([]),
  test_schedules: z.array(z.any()).default([]),
});

export class CreateProgramDto extends createZodDto(CreateProgramSchema) {}
export type CreateProgram = z.infer<typeof CreateProgramSchema>;
