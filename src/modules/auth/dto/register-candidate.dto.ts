import { IsEmail, IsOptional, IsString, MinLength, MaxLength, IsUrl } from 'class-validator';

export class RegisterCandidateDto {
  @IsUrl() url!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) @MaxLength(255) password!: string;
  @IsOptional() @IsString() @MaxLength(255) name?: string;
  @IsOptional() @IsString() @MaxLength(50)  phone?: string;
}
