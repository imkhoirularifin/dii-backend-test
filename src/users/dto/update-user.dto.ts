import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Email address',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description: 'Password (minimum 6 characters)',
    required: false,
  })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name',
    required: false,
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({
    example: true,
    description: 'User active status',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
