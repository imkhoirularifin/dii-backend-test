import { ApiProperty } from '@nestjs/swagger';

export class UserData {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  roleId: string;

  @ApiProperty()
  roleName: string;

  @ApiProperty()
  roleCode: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ type: UserData })
  user: UserData;
}
