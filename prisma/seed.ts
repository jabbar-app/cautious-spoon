/* eslint-disable no-console */
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PERMISSIONS } from './seed/permissions';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@mail.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe_Dev!123';
  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

  // Extra safety: clear RBAC again (idempotent with migration)
  await prisma.admin_roles.deleteMany({});
  await prisma.role_permissions.deleteMany({});
  await prisma.permissions.deleteMany({});
  await prisma.roles.deleteMany({});

  // Insert permissions
  const titles = Array.from(new Set(PERMISSIONS.filter(Boolean).map(s => s.trim())));
  if (titles.length) {
    await prisma.permissions.createMany({
      data: titles.map((title) => ({ title })),
      skipDuplicates: true,
    });
  }

  // Create system_admin role
  const systemRole = await prisma.roles.create({
    data: { title: 'system_admin', description: 'System Administrator with all permissions' },
  });

  // Attach all permissions to system_admin
  const allPerms = await prisma.permissions.findMany({ select: { id: true } });
  if (allPerms.length) {
    await prisma.role_permissions.createMany({
      data: allPerms.map((p) => ({ id_role: systemRole.id, id_permission: p.id })),
      skipDuplicates: true,
    });
  }

  // Ensure admin exists and attach role
  let admin = await prisma.admins.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.admins.create({
      data: {
        email: adminEmail,
        password: await bcrypt.hash(adminPassword, rounds),
        email_verified: true,
        created_at: new Date(),
      },
    });
  }

  await prisma.admin_roles.upsert({
    where: { id_admin_id_role: { id_admin: admin.id, id_role: systemRole.id } },
    update: {},
    create: { id_admin: admin.id, id_role: systemRole.id, created_at: new Date() },
  });

  console.log('Seed OK →', { adminEmail, permissions: titles.length, role: 'system_admin' });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
