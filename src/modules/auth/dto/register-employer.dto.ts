import { IsEmail, IsOptional, IsString, MinLength, MaxLength, IsUrl } from 'class-validator';

export class RegisterEmployerDto {
  @IsUrl() url!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) @MaxLength(255) password!: string;
  @IsOptional() @IsString() @MaxLength(255) name?: string;
  @IsOptional() @IsString() @MaxLength(20)  phone?: string;
}
