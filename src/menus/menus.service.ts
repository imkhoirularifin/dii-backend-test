import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

export interface MenuTree {
  id: string;
  menuName: string;
  menuCode: string;
  menuUrl: string | null;
  menuIcon: string | null;
  menuOrder: number;
  menuLevel: number;
  isActive: boolean;
  permissions?: {
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
  children?: MenuTree[];
}

interface MenuWithPermissions {
  id: string;
  menuName: string;
  menuCode: string;
  menuUrl: string | null;
  menuIcon: string | null;
  menuOrder: number;
  menuLevel: number;
  isActive: boolean;
  parentId: string | null;
  permissions?: {
    canView: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

  async create(createMenuDto: CreateMenuDto) {
    const {
      parentId,
      menuName,
      menuCode,
      menuUrl,
      menuIcon,
      menuOrder,
      menuLevel,
      isActive,
    } = createMenuDto;

    // Check if menu code already exists
    const existingMenu = await this.prisma.menu.findUnique({
      where: { menuCode },
    });

    if (existingMenu) {
      throw new ConflictException('Menu code already exists');
    }

    // If parentId is provided, verify it exists and calculate level
    let calculatedLevel = 1;
    if (parentId) {
      const parentMenu = await this.prisma.menu.findUnique({
        where: { id: parentId },
      });

      if (!parentMenu) {
        throw new BadRequestException('Parent menu not found');
      }

      calculatedLevel = parentMenu.menuLevel + 1;
    }

    const menu = await this.prisma.menu.create({
      data: {
        parentId,
        menuName,
        menuCode,
        menuUrl,
        menuIcon,
        menuOrder: menuOrder ?? 0,
        menuLevel: menuLevel ?? calculatedLevel,
        isActive: isActive ?? true,
      },
    });

    return menu;
  }

  async findAll(includeInactive = false) {
    const menus = await this.prisma.menu.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ menuLevel: 'asc' }, { menuOrder: 'asc' }],
    });

    // Build hierarchical tree
    return this.buildMenuTree(menus);
  }

  async findOne(id: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          orderBy: { menuOrder: 'asc' },
        },
        roleAccess: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }

    return menu;
  }

  async update(id: string, updateMenuDto: UpdateMenuDto) {
    const {
      parentId,
      menuName,
      menuUrl,
      menuIcon,
      menuOrder,
      menuLevel,
      isActive,
    } = updateMenuDto;

    // Check if menu exists
    const menu = await this.prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }

    // If updating parentId, verify it exists and prevent circular references
    if (parentId !== undefined) {
      if (parentId === id) {
        throw new BadRequestException('Menu cannot be its own parent');
      }

      if (parentId) {
        const parentMenu = await this.prisma.menu.findUnique({
          where: { id: parentId },
        });

        if (!parentMenu) {
          throw new BadRequestException('Parent menu not found');
        }

        // Check if the new parent is a descendant of this menu
        const isDescendant = await this.isDescendant(id, parentId);
        if (isDescendant) {
          throw new BadRequestException(
            'Cannot set a descendant menu as parent (circular reference)',
          );
        }
      }
    }

    const updatedMenu = await this.prisma.menu.update({
      where: { id },
      data: {
        parentId,
        menuName,
        menuUrl,
        menuIcon,
        menuOrder,
        menuLevel,
        isActive,
      },
    });

    return updatedMenu;
  }

  async remove(id: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!menu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }

    // Check if menu has children
    if (menu.children.length > 0) {
      throw new BadRequestException(
        'Cannot delete menu with children. Delete children first or reassign them.',
      );
    }

    await this.prisma.menu.delete({
      where: { id },
    });

    return { message: 'Menu successfully deleted' };
  }

  async getUserAccessibleMenus(userId: string, roleId: string) {
    // Get user's role menu access
    const menuAccess = await this.prisma.roleMenuAccess.findMany({
      where: {
        roleId,
        canView: true,
        menu: {
          isActive: true,
        },
      },
      include: {
        menu: true,
      },
      orderBy: {
        menu: {
          menuOrder: 'asc',
        },
      },
    });

    const accessibleMenus = menuAccess.map((access) => ({
      ...access.menu,
      permissions: {
        canView: access.canView,
        canCreate: access.canCreate,
        canUpdate: access.canUpdate,
        canDelete: access.canDelete,
      },
    }));

    // Build hierarchical tree
    return this.buildMenuTree(accessibleMenus);
  }

  private buildMenuTree(
    menus: MenuWithPermissions[],
    parentId: string | null = null,
  ): MenuTree[] {
    const tree: MenuTree[] = [];

    for (const menu of menus) {
      if (menu.parentId === parentId) {
        const children = this.buildMenuTree(menus, menu.id);
        const node: MenuTree = {
          id: menu.id,
          menuName: menu.menuName,
          menuCode: menu.menuCode,
          menuUrl: menu.menuUrl,
          menuIcon: menu.menuIcon,
          menuOrder: menu.menuOrder,
          menuLevel: menu.menuLevel,
          isActive: menu.isActive,
        };

        if (menu.permissions) {
          node.permissions = menu.permissions;
        }

        if (children.length > 0) {
          node.children = children;
        }

        tree.push(node);
      }
    }

    return tree.sort((a, b) => a.menuOrder - b.menuOrder);
  }

  private async isDescendant(
    ancestorId: string,
    descendantId: string,
  ): Promise<boolean> {
    const descendant = await this.prisma.menu.findUnique({
      where: { id: descendantId },
    });

    if (!descendant || !descendant.parentId) {
      return false;
    }

    if (descendant.parentId === ancestorId) {
      return true;
    }

    return this.isDescendant(ancestorId, descendant.parentId);
  }
}
