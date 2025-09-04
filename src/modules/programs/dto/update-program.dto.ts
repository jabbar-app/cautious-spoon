import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateProgramSchema = z.object({
  title: z.string().optional(),
  registration_date: z.coerce.date().optional(),
  program_start_date: z.coerce.date().optional(),
  training_centre: z.string().optional(),
  capacity: z.coerce.bigint().optional(),
  description: z.string().optional(),
  photo: z.string().optional(),
  price: z.coerce.bigint().optional(),
  duration: z.coerce.bigint().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  is_visible: z.boolean().optional(),
  formulir: z.array(z.string()).optional(),
  test_schedules: z.array(z.any()).optional(),
});

export class UpdateProgramDto extends createZodDto(UpdateProgramSchema) {}
export type UpdateProgram = z.infer<typeof UpdateProgramSchema>;
