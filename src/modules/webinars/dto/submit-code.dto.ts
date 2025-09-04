import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SubmitAttendanceCodeSchema = z.object({
  code: z.string().trim().min(4).max(12),
});

export class SubmitAttendanceCodeDto extends createZodDto(SubmitAttendanceCodeSchema) {}
export type SubmitAttendanceCode = z.infer<typeof SubmitAttendanceCodeSchema>;
