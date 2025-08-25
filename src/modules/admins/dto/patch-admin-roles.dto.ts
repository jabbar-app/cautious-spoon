import { IsArray, IsOptional, IsString } from 'class-validator';

export class PatchAdminRolesDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attach?: string[]; // role titles

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  detach?: string[]; // role titles
}
