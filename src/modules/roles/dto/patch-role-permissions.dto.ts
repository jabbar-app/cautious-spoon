import { IsArray, IsOptional, IsString } from 'class-validator';

export class PatchRolePermissionsDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attach?: string[]; // permission titles (slugs)

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  detach?: string[]; // permission titles (slugs)
}
