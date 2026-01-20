import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { username, email, password, fullName, isActive } = createUserDto;

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
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        fullName,
        isActive: isActive ?? true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { fullName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          userRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  roleName: true,
                  roleCode: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                roleName: true,
                roleCode: true,
                description: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { email, password, fullName, isActive } = updateUserDto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check email uniqueness if updating email
    if (email && email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Hash password if updating
    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        email,
        password: hashedPassword,
        fullName,
        isActive,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Soft delete - set isActive to false
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'User successfully deactivated' };
  }

  async getUserRoles(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user.userRoles.map((ur) => ({
      ...ur.role,
      isDefault: ur.isDefault,
      assignedAt: ur.assignedAt,
    }));
  }

  async assignRole(
    userId: string,
    assignRoleDto: AssignRoleDto,
    assignedBy?: string,
  ) {
    const { roleId, isDefault } = assignRoleDto;

    // Check if user exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if role exists
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Check if role is already assigned
    const existingAssignment = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
      },
    });

    if (existingAssignment) {
      throw new ConflictException('Role already assigned to user');
    }

    // If this is set as default, remove default from other roles
    if (isDefault) {
      await this.prisma.userRole.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    // Assign role
    const userRole = await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        isDefault: isDefault ?? false,
        assignedBy,
      },
      include: {
        role: true,
      },
    });

    return userRole;
  }

  async removeRole(userId: string, roleId: string) {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
      },
    });

    if (!userRole) {
      throw new NotFoundException('Role assignment not found');
    }

    await this.prisma.userRole.delete({
      where: { id: userRole.id },
    });

    return { message: 'Role successfully removed from user' };
  }
}
