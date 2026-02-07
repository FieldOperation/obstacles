import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create zones
  const zone1 = await prisma.zone.upsert({
    where: { name: 'Zone A' },
    update: {},
    create: {
      name: 'Zone A'
    }
  });

  const zone2 = await prisma.zone.upsert({
    where: { name: 'Zone B' },
    update: {},
    create: {
      name: 'Zone B'
    }
  });

  // Create roads
  const road1 = await prisma.road.upsert({
    where: {
      name_zoneId: {
        name: 'Main Street',
        zoneId: zone1.id
      }
    },
    update: {},
    create: {
      name: 'Main Street',
      zoneId: zone1.id
    }
  });

  const road2 = await prisma.road.upsert({
    where: {
      name_zoneId: {
        name: 'Highway 101',
        zoneId: zone1.id
      }
    },
    update: {},
    create: {
      name: 'Highway 101',
      zoneId: zone1.id
    }
  });

  const road3 = await prisma.road.upsert({
    where: {
      name_zoneId: {
        name: 'Park Avenue',
        zoneId: zone2.id
      }
    },
    update: {},
    create: {
      name: 'Park Avenue',
      zoneId: zone2.id
    }
  });

  // Create developers
  const developer1 = await prisma.developer.upsert({
    where: { name: 'ABC Developers' },
    update: {},
    create: {
      name: 'ABC Developers'
    }
  });

  const developer2 = await prisma.developer.upsert({
    where: { name: 'XYZ Construction' },
    update: {},
    create: {
      name: 'XYZ Construction'
    }
  });

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN'
    }
  });

  const worker = await prisma.user.upsert({
    where: { email: 'worker@example.com' },
    update: {},
    create: {
      email: 'worker@example.com',
      password: hashedPassword,
      name: 'Worker User',
      role: 'WORKER',
      zoneId: zone1.id
    }
  });

  const others = await prisma.user.upsert({
    where: { email: 'others@example.com' },
    update: {},
    create: {
      email: 'others@example.com',
      password: hashedPassword,
      name: 'Read-Only User',
      role: 'OTHERS'
    }
  });

  console.log('Database seeded successfully!');
  console.log('Default users created:');
  console.log('  Admin: admin@example.com / password123');
  console.log('  Worker: worker@example.com / password123');
  console.log('  Others: others@example.com / password123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
