import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CurrentUserData } from '../../common/decorators/current-user.decorator';

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  roleId: string;
  roleCode: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  validate(payload: JwtPayload): CurrentUserData {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }

    return {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
      roleId: payload.roleId,
      roleCode: payload.roleCode,
    };
  }
}
