import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

describe('Prisma Database Connection', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    // Use test database URL if available
    if (process.env.DATABASE_URL_TEST) {
      process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
    }
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to the database', async () => {
    // Test connection by running a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should have correct models defined', () => {
    // Check that our main models exist
    expect(prisma.owner).toBeDefined();
    expect(prisma.formTemplate).toBeDefined();
    expect(prisma.formInstance).toBeDefined();
    expect(prisma.formResponse).toBeDefined();
    expect(prisma.auditLog).toBeDefined();
  });

  it('should handle connection errors gracefully', async () => {
    const badPrisma = new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://bad:connection@nowhere:5432/none'
        }
      }
    });

    try {
      await badPrisma.$connect();
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeDefined();
    } finally {
      await badPrisma.$disconnect();
    }
  });
});