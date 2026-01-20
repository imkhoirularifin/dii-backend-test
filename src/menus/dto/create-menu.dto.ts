import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsBoolean,
} from 'class-validator';

export class CreateMenuDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Parent menu ID (null for root menu)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ example: 'Dashboard', description: 'Menu name' })
  @IsString()
  @IsNotEmpty()
  menuName: string;

  @ApiProperty({ example: 'DASHBOARD', description: 'Unique menu code' })
  @IsString()
  @IsNotEmpty()
  menuCode: string;

  @ApiProperty({
    example: '/dashboard',
    description: 'Menu URL/path for frontend',
    required: false,
  })
  @IsString()
  @IsOptional()
  menuUrl?: string;

  @ApiProperty({
    example: 'dashboard-icon',
    description: 'Icon class or name',
    required: false,
  })
  @IsString()
  @IsOptional()
  menuIcon?: string;

  @ApiProperty({
    example: 1,
    description: 'Display order',
    required: false,
  })
  @IsInt()
  @IsOptional()
  menuOrder?: number;

  @ApiProperty({
    example: 1,
    description: 'Menu depth level',
    required: false,
  })
  @IsInt()
  @IsOptional()
  menuLevel?: number;

  @ApiProperty({
    example: true,
    description: 'Menu active status',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
