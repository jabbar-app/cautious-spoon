import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateWebinarSchema = z.object({
  id: z.string().min(1).optional(),          // optional custom id
  id_program: z.string().min(1).optional(),  // <-- now optional, can be omitted
  title: z.string().default(''),
  registration_date: z.coerce.date().optional(),
  webinar_date: z.coerce.date().optional(),
  capacity: z.coerce.bigint().optional(),
  description: z.string().default(''),
  photo: z.string().default(''),
  link: z.string().default(''),
  price: z.coerce.bigint().optional(),
  duration: z.coerce.bigint().optional(),
  speakers: z.array(z.string()).default([]),
  category: z.string().default(''),
  status: z.string().default('upcoming'),
  is_visible: z.boolean().default(true),
});

export class CreateWebinarDto extends createZodDto(CreateWebinarSchema) {}
export type CreateWebinar = z.infer<typeof CreateWebinarSchema>;
