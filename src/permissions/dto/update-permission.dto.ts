import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePermissionDto {
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
