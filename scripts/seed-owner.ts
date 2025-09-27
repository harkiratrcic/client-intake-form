import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  const owner = await prisma.owner.upsert({
    where: { email: 'owner@test.com' },
    update: {},
    create: {
      email: 'owner@test.com',
      passwordHash: hashedPassword,
      businessName: 'Test Immigration Consulting',
      rcicNumber: 'R12345',
      contactPhone: '555-0100',
      contactAddress: '123 Test Street, Toronto, ON M1M 1M1',
      isActive: true,
    },
  });

  console.log('Test owner created:', owner.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });