import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  dynamicTitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
