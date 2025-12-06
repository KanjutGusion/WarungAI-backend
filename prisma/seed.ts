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
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'root@root.root' },
    update: {},
    create: {
      email: 'root@root.root',
      password: await bcrypt.hash('password', 10),
      status: EUserStatus.ACTIVE,
    },
  });

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
  await prisma.userRole.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});

  const args = minimist(process.argv.slice(2));

  const runAll = args.all || Object.keys(args).length === 1;
  if (runAll || args.role) await seedRoles();
  if (runAll || args.user) await seedSuperAdminUser();
  if (runAll || args.user) {
  }
}

main()
  .catch((e) => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
