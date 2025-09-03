// import { IsEmail, IsString, IsUrl, MaxLength } from 'class-validator';

// export class ForgotPasswordDto {
//   @IsEmail() @MaxLength(225) email!: string;
//   @IsString() @IsUrl({ require_tld: false }) url!: string;
// }


import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ForgotPasswordSchema = z.object({
  email: z.email(),
  url: z.url(),
});

export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}