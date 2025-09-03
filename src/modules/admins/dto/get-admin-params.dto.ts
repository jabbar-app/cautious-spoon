import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetAdminParamsSchema = z.object({
  id: z.uuid(),
});

export class GetAdminParamsDto extends createZodDto(GetAdminParamsSchema) {}
export type GetAdminParams = z.infer<typeof GetAdminParamsSchema>;
