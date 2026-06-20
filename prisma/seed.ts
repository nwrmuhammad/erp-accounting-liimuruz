import { PrismaClient, RoleType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  PERMISSION_DEFINITIONS,
  ROLE_PERMISSION_MATRIX,
} from '../src/core/constants/permissions';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '../src/core/constants/roles';

const prisma = new PrismaClient();

const BRANCHES = [
  {
    name: 'Toshkent - Chilonzor',
    code: 'TAS-CHL',
    region: 'Toshkent',
    city: 'Toshkent',
  },
  {
    name: 'Toshkent - Solnechniy',
    code: 'TAS-SOL',
    region: 'Toshkent',
    city: 'Toshkent',
  },
  {
    name: 'Surxandaryo - Termiz',
    code: 'SUR-TER',
    region: 'Surxandaryo',
    city: 'Termiz',
  },
  { name: 'Samarqand', code: 'SAM-001', region: 'Samarqand', city: 'Samarqand' },
  { name: 'Buxoro', code: 'BUX-001', region: 'Buxoro', city: 'Buxoro' },
] as const;

async function seedPermissions() {
  for (const p of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { name: p.name, resource: p.resource, action: p.action },
      create: {
        key: p.key,
        name: p.name,
        resource: p.resource,
        action: p.action,
      },
    });
  }
  console.log(`✓ Seeded ${PERMISSION_DEFINITIONS.length} permissions`);
}

async function seedRoles() {
  for (const type of Object.values(RoleType)) {
    const role = await prisma.role.upsert({
      where: { type },
      update: { name: ROLE_LABELS[type], description: ROLE_DESCRIPTIONS[type] },
      create: {
        type,
        name: ROLE_LABELS[type],
        description: ROLE_DESCRIPTIONS[type],
        isSystem: true,
      },
    });

    const permissionKeys = ROLE_PERMISSION_MATRIX[type];
    const permissions = await prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
    });

    // Reset and reassign role permissions idempotently.
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissions.map((perm) => ({
        roleId: role.id,
        permissionId: perm.id,
      })),
      skipDuplicates: true,
    });
    console.log(`✓ Role ${type}: ${permissions.length} permissions`);
  }
}

async function seedBranches() {
  for (const branch of BRANCHES) {
    await prisma.branch.upsert({
      where: { code: branch.code },
      update: { name: branch.name, region: branch.region, city: branch.city },
      create: { ...branch },
    });
  }
  console.log(`✓ Seeded ${BRANCHES.length} branches`);
}

async function seedUsers() {
  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { type: RoleType.SUPER_ADMIN },
  });
  const bossRole = await prisma.role.findUniqueOrThrow({
    where: { type: RoleType.BOSS },
  });
  const employeeRole = await prisma.role.findUniqueOrThrow({
    where: { type: RoleType.EMPLOYEE },
  });
  const chilonzor = await prisma.branch.findUniqueOrThrow({
    where: { code: 'TAS-CHL' },
  });

  const users = [
    {
      email: (
        process.env.SEED_SUPER_ADMIN_EMAIL ?? 'admin@accounting-saas.uz'
      ).toLowerCase(),
      password: process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'Admin12345!',
      firstName: 'Super',
      lastName: 'Admin',
      roleId: superAdminRole.id,
      branchId: null as string | null,
    },
    {
      email: (
        process.env.SEED_BOSS_EMAIL ?? 'boss.chilonzor@accounting-saas.uz'
      ).toLowerCase(),
      password: process.env.SEED_BOSS_PASSWORD ?? 'Boss12345!',
      firstName: 'Chilonzor',
      lastName: 'Boss',
      roleId: bossRole.id,
      branchId: chilonzor.id,
    },
    {
      email: (
        process.env.SEED_EMPLOYEE_EMAIL ??
        'employee.chilonzor@accounting-saas.uz'
      ).toLowerCase(),
      password: process.env.SEED_EMPLOYEE_PASSWORD ?? 'Employee12345!',
      firstName: 'Chilonzor',
      lastName: 'Employee',
      roleId: employeeRole.id,
      branchId: chilonzor.id,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        firstName: u.firstName,
        lastName: u.lastName,
        roleId: u.roleId,
        branchId: u.branchId,
      },
      create: {
        email: u.email,
        passwordHash: await bcrypt.hash(u.password, rounds),
        firstName: u.firstName,
        lastName: u.lastName,
        roleId: u.roleId,
        branchId: u.branchId,
      },
    });
    console.log(`✓ User ${u.email}`);
  }
}

async function main() {
  console.log('— Seeding database —');
  await seedPermissions();
  await seedRoles();
  await seedBranches();
  await seedUsers();
  console.log('— Seed complete —');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
