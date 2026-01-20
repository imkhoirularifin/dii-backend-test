import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  console.log('Starting database seed...');

  // Create admin role
  const adminRole = await prisma.role.upsert({
    where: { roleCode: 'ADMIN' },
    update: {},
    create: {
      roleName: 'Administrator',
      roleCode: 'ADMIN',
      description: 'System administrator with full access',
      isActive: true,
    },
  });

  console.log('✓ Created admin role:', adminRole.roleCode);

  // Create manager role
  const managerRole = await prisma.role.upsert({
    where: { roleCode: 'MANAGER' },
    update: {},
    create: {
      roleName: 'Manager',
      roleCode: 'MANAGER',
      description: 'Department manager',
      isActive: true,
    },
  });

  console.log('✓ Created manager role:', managerRole.roleCode);

  // Create staff role
  const staffRole = await prisma.role.upsert({
    where: { roleCode: 'STAFF' },
    update: {},
    create: {
      roleName: 'Staff',
      roleCode: 'STAFF',
      description: 'Regular staff member',
      isActive: true,
    },
  });

  console.log('✓ Created staff role:', staffRole.roleCode);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      fullName: 'System Administrator',
      isActive: true,
    },
  });

  console.log('✓ Created admin user:', adminUser.username);

  // Assign admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
      isDefault: true,
      assignedBy: adminUser.id,
    },
  });

  console.log('✓ Assigned admin role to admin user');

  // Create menus
  const dashboardMenu = await prisma.menu.upsert({
    where: { menuCode: 'DASHBOARD' },
    update: {},
    create: {
      menuName: 'Dashboard',
      menuCode: 'DASHBOARD',
      menuUrl: '/dashboard',
      menuIcon: 'dashboard',
      menuOrder: 1,
      menuLevel: 1,
      isActive: true,
    },
  });

  console.log('✓ Created dashboard menu');

  const userMgmtMenu = await prisma.menu.upsert({
    where: { menuCode: 'USER_MGMT' },
    update: {},
    create: {
      menuName: 'User Management',
      menuCode: 'USER_MGMT',
      menuUrl: '/users',
      menuIcon: 'users',
      menuOrder: 2,
      menuLevel: 1,
      isActive: true,
    },
  });

  console.log('✓ Created user management menu');

  const roleMgmtMenu = await prisma.menu.upsert({
    where: { menuCode: 'ROLE_MGMT' },
    update: {},
    create: {
      menuName: 'Role Management',
      menuCode: 'ROLE_MGMT',
      menuUrl: '/roles',
      menuIcon: 'shield',
      menuOrder: 3,
      menuLevel: 1,
      isActive: true,
    },
  });

  console.log('✓ Created role management menu');

  const menuMgmtMenu = await prisma.menu.upsert({
    where: { menuCode: 'MENU_MGMT' },
    update: {},
    create: {
      menuName: 'Menu Management',
      menuCode: 'MENU_MGMT',
      menuUrl: '/menus',
      menuIcon: 'menu',
      menuOrder: 4,
      menuLevel: 1,
      isActive: true,
    },
  });

  console.log('✓ Created menu management menu');

  // Create submenu under user management
  const userListMenu = await prisma.menu.upsert({
    where: { menuCode: 'USER_LIST' },
    update: {},
    create: {
      parentId: userMgmtMenu.id,
      menuName: 'User List',
      menuCode: 'USER_LIST',
      menuUrl: '/users/list',
      menuIcon: 'list',
      menuOrder: 1,
      menuLevel: 2,
      isActive: true,
    },
  });

  console.log('✓ Created user list submenu');

  // Assign full permissions to admin role for all menus
  const menus = [
    dashboardMenu,
    userMgmtMenu,
    roleMgmtMenu,
    menuMgmtMenu,
    userListMenu,
  ];

  for (const menu of menus) {
    await prisma.roleMenuAccess.upsert({
      where: {
        roleId_menuId: {
          roleId: adminRole.id,
          menuId: menu.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        menuId: menu.id,
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      },
    });
  }

  console.log('✓ Assigned full permissions to admin role');

  // Assign view-only permissions to staff role for dashboard
  await prisma.roleMenuAccess.upsert({
    where: {
      roleId_menuId: {
        roleId: staffRole.id,
        menuId: dashboardMenu.id,
      },
    },
    update: {},
    create: {
      roleId: staffRole.id,
      menuId: dashboardMenu.id,
      canView: true,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
    },
  });

  console.log('✓ Assigned view permission to staff role for dashboard');

  console.log('\n✅ Database seeded successfully!');
  console.log('\nDefault admin credentials:');
  console.log('  Username: admin');
  console.log('  Password: admin123');
  console.log('  Email: admin@example.com');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
