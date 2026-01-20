import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    example: 'Administrator',
    description: 'Role name',
    required: false,
  })
  @IsString()
  @IsOptional()
  roleName?: string;

  @ApiProperty({
    example: 'System administrator with full access',
    description: 'Role description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: true,
    description: 'Role active status',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
