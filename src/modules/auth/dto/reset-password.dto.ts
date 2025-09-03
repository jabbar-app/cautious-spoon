// import { IsString, MinLength } from 'class-validator';

// export class ResetPasswordDto {
//   @IsString() token!: string;

//   @IsString() @MinLength(8) password!: string;
// }


import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

// mimic class-validator style DTO
export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}