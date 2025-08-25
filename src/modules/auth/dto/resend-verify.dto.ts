import { IsEmail, IsString, IsUrl, MaxLength } from 'class-validator';

export class ResendVerifyDto {
  @IsEmail()
  @MaxLength(225)
  email!: string;


  @IsString()
  @IsUrl({ require_tld: false })
  url!: string;
}
