import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

interface UserRole {
  roleId: string;
  isDefault: boolean;
  role: {
    id: string;
    roleName: string;
    roleCode: string;
    isActive: boolean;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { username, email, password, fullName } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        fullName,
      },
    });

    // For new users, we need to assign a default role or let admin assign it
    // Here we'll return tokens without a role - user needs role assignment first
    throw new BadRequestException(
      'User created successfully. Please contact admin to assign a role before logging in.',
    );
  }

  async login(
    loginDto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const { username, password, roleId } = loginDto;

    // Find user by username or email
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
        isActive: true,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user has any roles
    if (!user.userRoles || user.userRoles.length === 0) {
      throw new UnauthorizedException(
        'No roles assigned. Please contact admin.',
      );
    }

    // Determine which role to use
    let selectedUserRole: UserRole;
    if (roleId) {
      // Find specific role
      const foundRole = user.userRoles.find((ur) => ur.roleId === roleId);
      if (!foundRole) {
        throw new BadRequestException('Invalid role selected');
      }
      selectedUserRole = foundRole as UserRole;
    } else {
      // Use default role or first role
      const defaultRole =
        user.userRoles.find((ur) => ur.isDefault) || user.userRoles[0];
      selectedUserRole = defaultRole as UserRole;
    }

    const role = selectedUserRole.role;

    if (!role.isActive) {
      throw new UnauthorizedException('Selected role is inactive');
    }

    // Generate tokens
    const tokens = this.generateTokens(
      user.id,
      user.username,
      user.email,
      role.id,
      role.roleCode,
    );

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() +
        parseInt(
          this.configService
            .get<string>('JWT_REFRESH_EXPIRATION')
            ?.replace('d', '') || '7',
        ),
    );

    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        roleId: role.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        roleId: role.id,
        roleName: role.roleName,
        roleCode: role.roleCode,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Find session
      const session = await this.prisma.userSession.findFirst({
        where: {
          refreshToken,
          userId: payload.sub,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
          role: true,
        },
      });

      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const signOptions: JwtSignOptions = {
        secret:
          this.configService.get<string>('JWT_SECRET') || 'default-secret',
      };

      const accessToken = this.jwtService.sign(
        {
          sub: session.user.id,
          username: session.user.username,
          email: session.user.email,
          roleId: session.role.id,
          roleCode: session.role.roleCode,
        },
        signOptions,
      );

      // Update session token
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: { token: accessToken },
      });

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, token: string): Promise<void> {
    await this.prisma.userSession.deleteMany({
      where: {
        userId,
        token,
      },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        isActive: true,
        createdAt: true,
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                roleName: true,
                roleCode: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private generateTokens(
    userId: string,
    username: string,
    email: string,
    roleId: string,
    roleCode: string,
  ) {
    const payload: JwtPayload = {
      sub: userId,
      username,
      email,
      roleId,
      roleCode,
    };

    const accessTokenOptions: JwtSignOptions = {
      secret: this.configService.get<string>('JWT_SECRET') || 'default-secret',
    };

    const refreshTokenOptions: JwtSignOptions = {
      secret:
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'default-refresh-secret',
    };

    const accessToken = this.jwtService.sign(payload, accessTokenOptions);
    const refreshToken = this.jwtService.sign(payload, refreshTokenOptions);

    return { accessToken, refreshToken };
  }
}
