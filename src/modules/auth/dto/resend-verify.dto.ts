// import { IsEmail, IsString, IsUrl, MaxLength } from 'class-validator';

// export class ResendVerifyDto {
//   @IsEmail() @MaxLength(225) email!: string;


//   @IsString() @IsUrl({ require_tld: false }) url!: string;
// }


import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ResendVerifySchema = z.object({
  email: z.email(),
  url: z.url(),
});

// mimic class-validator style DTO
export class ResendVerifyDto extends createZodDto(ResendVerifySchema) {}