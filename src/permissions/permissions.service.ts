import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const { roleId, menuId, canView, canCreate, canUpdate, canDelete } =
      createPermissionDto;

    // Check if role exists
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Check if menu exists
    const menu = await this.prisma.menu.findUnique({ where: { id: menuId } });
    if (!menu) {
      throw new NotFoundException(`Menu with ID ${menuId} not found`);
    }

    // Check if permission already exists
    const existingPermission = await this.prisma.roleMenuAccess.findFirst({
      where: {
        roleId,
        menuId,
      },
    });

    if (existingPermission) {
      throw new ConflictException(
        'Permission for this role and menu already exists',
      );
    }

    const permission = await this.prisma.roleMenuAccess.create({
      data: {
        roleId,
        menuId,
        canView: canView ?? true,
        canCreate: canCreate ?? false,
        canUpdate: canUpdate ?? false,
        canDelete: canDelete ?? false,
      },
      include: {
        role: {
          select: {
            id: true,
            roleName: true,
            roleCode: true,
          },
        },
        menu: {
          select: {
            id: true,
            menuName: true,
            menuCode: true,
          },
        },
      },
    });

    return permission;
  }

  async findAll() {
    const permissions = await this.prisma.roleMenuAccess.findMany({
      include: {
        role: {
          select: {
            id: true,
            roleName: true,
            roleCode: true,
          },
        },
        menu: {
          select: {
            id: true,
            menuName: true,
            menuCode: true,
          },
        },
      },
      orderBy: [
        {
          role: {
            roleName: 'asc',
          },
        },
        {
          menu: {
            menuOrder: 'asc',
          },
        },
      ],
    });

    return permissions;
  }

  async findByRole(roleId: string) {
    // Check if role exists
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    const permissions = await this.prisma.roleMenuAccess.findMany({
      where: { roleId },
      include: {
        menu: {
          select: {
            id: true,
            menuName: true,
            menuCode: true,
            menuUrl: true,
            menuIcon: true,
            menuOrder: true,
            menuLevel: true,
          },
        },
      },
      orderBy: {
        menu: {
          menuOrder: 'asc',
        },
      },
    });

    return permissions;
  }

  async findOne(id: string) {
    const permission = await this.prisma.roleMenuAccess.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            roleName: true,
            roleCode: true,
          },
        },
        menu: {
          select: {
            id: true,
            menuName: true,
            menuCode: true,
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    const { canView, canCreate, canUpdate, canDelete } = updatePermissionDto;

    // Check if permission exists
    const permission = await this.prisma.roleMenuAccess.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    const updatedPermission = await this.prisma.roleMenuAccess.update({
      where: { id },
      data: {
        canView,
        canCreate,
        canUpdate,
        canDelete,
      },
      include: {
        role: {
          select: {
            id: true,
            roleName: true,
            roleCode: true,
          },
        },
        menu: {
          select: {
            id: true,
            menuName: true,
            menuCode: true,
          },
        },
      },
    });

    return updatedPermission;
  }

  async remove(id: string) {
    const permission = await this.prisma.roleMenuAccess.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    await this.prisma.roleMenuAccess.delete({
      where: { id },
    });

    return { message: 'Permission successfully deleted' };
  }

  async checkPermission(
    roleId: string,
    menuCode: string,
    action: 'view' | 'create' | 'update' | 'delete',
  ): Promise<boolean> {
    const permission = await this.prisma.roleMenuAccess.findFirst({
      where: {
        roleId,
        menu: {
          menuCode,
        },
      },
    });

    if (!permission) {
      return false;
    }

    switch (action) {
      case 'view':
        return permission.canView;
      case 'create':
        return permission.canCreate;
      case 'update':
        return permission.canUpdate;
      case 'delete':
        return permission.canDelete;
      default:
        return false;
    }
  }
}
