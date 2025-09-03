// import { IsEmail, IsOptional, IsString, MinLength, MaxLength, IsUrl } from 'class-validator';

// export class RegisterEmployerDto {
//   @IsUrl() url!: string;
//   @IsEmail() email!: string;
//   @IsString() @MinLength(8) @MaxLength(255) password!: string;
//   @IsOptional() @IsString() @MaxLength(255) name?: string;
//   @IsOptional() @IsString() @MaxLength(20)  phone?: string;
// }

import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const RegisterEmployerSchema = z.object({
  url : z.url(),
  email: z.email(),
  password: z.string().min(6),
  name: z.string().max(255).optional(),
  phone: z.string().max(20).optional()
});

// mimic class-validator style DTO
export class RegisterEmployerDto extends createZodDto(RegisterEmployerSchema) {}

