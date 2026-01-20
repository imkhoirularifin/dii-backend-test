import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsBoolean, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Role ID',
  })
  @IsUUID()
  roleId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Menu ID',
  })
  @IsUUID()
  menuId: string;

  @ApiProperty({
    example: true,
    description: 'Can view permission',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  canView?: boolean;

  @ApiProperty({
    example: false,
    description: 'Can create permission',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  canCreate?: boolean;

  @ApiProperty({
    example: false,
    description: 'Can update permission',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  canUpdate?: boolean;

  @ApiProperty({
    example: false,
    description: 'Can delete permission',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  canDelete?: boolean;
}
