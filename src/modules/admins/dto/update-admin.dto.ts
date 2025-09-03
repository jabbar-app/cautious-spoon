import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const updateAdminSchema = z.object({
  email: z.email().optional(),
  password: z.string().min(8).optional(),
  name: z.string().max(225).optional(),
  phone: z.string().max(225).optional(),
});

export class UpdateAdminDto extends createZodDto(updateAdminSchema) {}
