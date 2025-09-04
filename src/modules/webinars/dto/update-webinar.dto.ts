import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateWebinarSchema = z.object({
  title: z.string().optional(),
  registration_date: z.coerce.date().optional(),
  webinar_date: z.coerce.date().optional(),
  capacity: z.coerce.bigint().optional(),
  description: z.string().optional(),
  photo: z.string().optional(),
  link: z.string().optional(),
  price: z.coerce.bigint().optional(),
  duration: z.coerce.bigint().optional(),
  speakers: z.array(z.string()).optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  is_visible: z.boolean().optional(),
});

export class UpdateWebinarDto extends createZodDto(UpdateWebinarSchema) {}
export type UpdateWebinar = z.infer<typeof UpdateWebinarSchema>;
