import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Administrator', description: 'Role name' })
  @IsString()
  @IsNotEmpty()
  roleName: string;

  @ApiProperty({ example: 'ADMIN', description: 'Unique role code' })
  @IsString()
  @IsNotEmpty()
  roleCode: string;

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
