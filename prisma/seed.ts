#!/usr/bin/env bun

import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import minimist from 'minimist';
import { EUserStatus, PrismaClient } from 'src/generated/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const roles = [
  {
    name: 'Super Admin',
    description: 'Full system access with all permissions',
  },
  {
    name: 'Seller',
    description: 'Member-level access with limited permissions',
  },
];

async function seedRoles() {
  console.log('👥 Creating default roles...');

  const roleCreateData = roles.map((r) => ({
    name: r.name,
    description: r.description,
  }));
  await prisma.role.createMany({
    data: roleCreateData,
    skipDuplicates: true,
  });
}

async function seedSuperAdminUser() {
  console.log('👤 Creating default super admin user...');
  const superAdminUser = await prisma.user.upsert({
    where: { phone: 'root@root.root' },
    update: {},
    create: {
      email: 'root@root.root',
      password: await bcrypt.hash('password', 10), // Change this in production
      status: EUserStatus.ACTIVE,
    },
  });

  // Assign super admin role to the user
  const superAdminRole = await prisma.role.findFirst({
    where: {
      name: 'Super Admin',
    },
  });

  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: {
        user_id_role_id: {
          user_id: superAdminUser.id,
          role_id: superAdminRole.id,
        },
      },
      update: {},
      create: {
        user_id: superAdminUser.id,
        role_id: superAdminRole.id,
      },
    });
  }
}

async function main() {
  const args = minimist(process.argv.slice(2));
  // --all = semua, default juga semua jika tanpa argumen
  // --permission, --role, --plan, --module, --user
  const runAll = args.all || Object.keys(args).length === 1;
  if (runAll || args.role) await seedRoles();
  if (runAll || args.user) await seedSuperAdminUser();
  console.log('✅ Database seeding completed!');
  if (runAll || args.user) {
    console.log('📧 Default admin phone: admin@letsschool.com');
    console.log(
      '🔑 Default admin password: password (change this in production!)',
    );
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
