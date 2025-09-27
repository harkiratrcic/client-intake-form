import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';

// Mock Prisma
jest.mock('../../prisma', () => ({
  prisma: {
    formInstance: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    formResponse: {
      findMany: jest.fn(),
    },
  },
}));

import { getDashboardStats, getRecentSubmissions, getExpiringForms } from '../stats-service';
import { prisma } from '../../prisma';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('StatsService', () => {
  const ownerId = 'owner-123';

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock current date for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-12-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getDashboardStats', () => {
    it('should return correct dashboard statistics', async () => {
      mockPrisma.formInstance.count
        .mockResolvedValueOnce(15) // totalForms
        .mockResolvedValueOnce(8)  // activeForms
        .mockResolvedValueOnce(6)  // submittedForms
        .mockResolvedValueOnce(1); // expiredForms

      const stats = await getDashboardStats(ownerId);

      expect(stats).toEqual({
        totalForms: 15,
        activeForms: 8,
        submittedForms: 6,
        expiredForms: 1,
      });

      // Verify correct queries were made
      expect(mockPrisma.formInstance.count).toHaveBeenCalledTimes(4);

      // Check total forms query
      expect(mockPrisma.formInstance.count).toHaveBeenNthCalledWith(1, {
        where: { ownerId },
      });

      // Check active forms query
      expect(mockPrisma.formInstance.count).toHaveBeenNthCalledWith(2, {
        where: {
          ownerId,
          status: 'SENT',
          expiresAt: {
            gt: new Date('2023-12-01'),
          },
        },
      });

      // Check submitted forms query
      expect(mockPrisma.formInstance.count).toHaveBeenNthCalledWith(3, {
        where: {
          ownerId,
          status: 'COMPLETED',
        },
      });

      // Check expired forms query
      expect(mockPrisma.formInstance.count).toHaveBeenNthCalledWith(4, {
        where: {
          ownerId,
          status: 'SENT',
          expiresAt: {
            lt: new Date('2023-12-01'),
          },
        },
      });
    });
  });

  describe('getRecentSubmissions', () => {
    it('should return recent submissions with correct data', async () => {
      const mockSubmissions = [
        {
          id: 'response-1',
          submissionId: 'SUB-123456',
          submittedAt: new Date('2023-11-30'),
          formInstance: {
            clientEmail: 'client1@example.com',
            createdAt: new Date('2023-11-25'),
          },
        },
        {
          id: 'response-2',
          submissionId: 'SUB-789012',
          submittedAt: new Date('2023-11-29'),
          formInstance: {
            clientEmail: 'client2@example.com',
            createdAt: new Date('2023-11-24'),
          },
        },
      ];

      mockPrisma.formResponse.findMany.mockResolvedValue(mockSubmissions);

      const submissions = await getRecentSubmissions(ownerId, 5);

      expect(submissions).toHaveLength(2);
      expect(submissions[0]).toEqual({
        id: 'response-1',
        submissionId: 'SUB-123456',
        submittedAt: new Date('2023-11-30'),
        formInstance: {
          clientEmail: 'client1@example.com',
          createdAt: new Date('2023-11-25'),
        },
      });

      expect(mockPrisma.formResponse.findMany).toHaveBeenCalledWith({
        where: {
          formInstance: {
            ownerId,
          },
          submittedAt: {
            not: null,
          },
        },
        include: {
          formInstance: {
            select: {
              clientEmail: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          submittedAt: 'desc',
        },
        take: 5,
      });
    });

    it('should use default limit when not provided', async () => {
      mockPrisma.formResponse.findMany.mockResolvedValue([]);

      await getRecentSubmissions(ownerId);

      expect(mockPrisma.formResponse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });
  });

  describe('getExpiringForms', () => {
    it('should return forms expiring within specified days', async () => {
      const mockForms = [
        {
          id: 'form-1',
          token: 'token-123',
          clientEmail: 'expiring1@example.com',
          createdAt: new Date('2023-11-25'),
          expiresAt: new Date('2023-12-03'), // 2 days from now
        },
        {
          id: 'form-2',
          token: 'token-456',
          clientEmail: 'expiring2@example.com',
          createdAt: new Date('2023-11-24'),
          expiresAt: new Date('2023-12-05'), // 4 days from now
        },
      ];

      mockPrisma.formInstance.findMany.mockResolvedValue(mockForms);

      const expiringForms = await getExpiringForms(ownerId, 7);

      expect(expiringForms).toHaveLength(2);
      expect(expiringForms[0]).toEqual({
        id: 'form-1',
        token: 'token-123',
        clientEmail: 'expiring1@example.com',
        createdAt: new Date('2023-11-25'),
        expiresAt: new Date('2023-12-03'),
        daysUntilExpiry: 2,
      });
      expect(expiringForms[1]).toEqual({
        id: 'form-2',
        token: 'token-456',
        clientEmail: 'expiring2@example.com',
        createdAt: new Date('2023-11-24'),
        expiresAt: new Date('2023-12-05'),
        daysUntilExpiry: 4,
      });

      expect(mockPrisma.formInstance.findMany).toHaveBeenCalledWith({
        where: {
          ownerId,
          status: 'SENT',
          expiresAt: {
            gt: new Date('2023-12-01'),
            lt: new Date('2023-12-08'), // 7 days ahead
          },
        },
        orderBy: {
          expiresAt: 'asc',
        },
      });
    });

    it('should use default daysAhead when not provided', async () => {
      mockPrisma.formInstance.findMany.mockResolvedValue([]);

      await getExpiringForms(ownerId);

      expect(mockPrisma.formInstance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            expiresAt: {
              gt: new Date('2023-12-01'),
              lt: new Date('2023-12-08'), // default 7 days
            },
          }),
        })
      );
    });

    it('should calculate days until expiry correctly', async () => {
      const mockForms = [
        {
          id: 'form-1',
          token: 'token-123',
          clientEmail: 'tomorrow@example.com',
          createdAt: new Date('2023-11-25'),
          expiresAt: new Date('2023-12-02'), // 1 day from now
        },
      ];

      mockPrisma.formInstance.findMany.mockResolvedValue(mockForms);

      const expiringForms = await getExpiringForms(ownerId, 7);

      expect(expiringForms[0].daysUntilExpiry).toBe(1);
    });
  });
});