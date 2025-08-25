import { IsEmail, IsString, IsUrl, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(225)
  email!: string;

  // Frontend "reset password" page, e.g. https://candidate.com/reset
  @IsString()
  @IsUrl({ require_tld: false }) // allow localhost during dev
  url!: string;
}