// import { IsEmail, IsString, MinLength } from 'class-validator';

// export class LoginDto {
//   @IsEmail() email!: string;

//   @IsString()
//   @MinLength(6)
//   password!: string;
// }

// import { z } from "zod";

// export const loginSchema = z.object({
//   email: z.email(),
//   password: z.string().min(6),
// });

// export type LoginDto = z.infer<typeof loginSchema>;


import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export class LoginDto extends createZodDto(loginSchema) {}