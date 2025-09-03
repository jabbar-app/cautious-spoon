import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Role id comes in URL as string; we’ll coerce to bigint in the service
export const GetRoleParamsSchema = z.object({
  id: z.string().min(1),
});

export class GetRoleParamsDto extends createZodDto(GetRoleParamsSchema) {}
