import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsBoolean, IsOptional } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Role ID to assign',
  })
  @IsUUID()
  roleId: string;

  @ApiProperty({
    example: false,
    description: 'Set as default role',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
