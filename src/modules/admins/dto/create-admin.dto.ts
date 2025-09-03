// src/modules/admins/dto/create-admin.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createAdminSchema = z.object({
  email: z.email(),
  password: z.string().min(8), // keep strong passwords for admins
  name: z.string().max(225).optional().default(''),
  phone: z.string().max(225).optional().default(''),
  roles: z
    .array(z.string().min(1))
    .optional()
    .transform((arr) => (arr ? Array.from(new Set(arr)) : arr)), // ensure unique role titles
});

export class CreateAdminDto extends createZodDto(createAdminSchema) {}
