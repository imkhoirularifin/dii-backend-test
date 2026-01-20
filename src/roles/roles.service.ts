import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const { roleName, roleCode, description, isActive } = createRoleDto;

    // Check if role code already exists
    const existingRole = await this.prisma.role.findFirst({
      where: {
        OR: [{ roleName }, { roleCode }],
      },
    });

    if (existingRole) {
      throw new ConflictException('Role name or code already exists');
    }

    const role = await this.prisma.role.create({
      data: {
        roleName,
        roleCode,
        description,
        isActive: isActive ?? true,
      },
    });

    return role;
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { roleName: { contains: search, mode: 'insensitive' as const } },
            { roleCode: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      data: roles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
        menuAccess: {
          include: {
            menu: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const { roleName, description, isActive } = updateRoleDto;

    // Check if role exists
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Check role name uniqueness if updating
    if (roleName && roleName !== role.roleName) {
      const existingRole = await this.prisma.role.findUnique({
        where: { roleName },
      });
      if (existingRole) {
        throw new ConflictException('Role name already exists');
      }
    }

    const updatedRole = await this.prisma.role.update({
      where: { id },
      data: {
        roleName,
        description,
        isActive,
      },
    });

    return updatedRole;
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Soft delete - set isActive to false
    await this.prisma.role.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Role successfully deactivated' };
  }

  async getRolePermissions(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        menuAccess: {
          include: {
            menu: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role.menuAccess;
  }
}
