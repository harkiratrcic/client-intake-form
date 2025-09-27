import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Mock Prisma
jest.mock('../../prisma', () => ({
  prisma: {
    formInstance: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

import { getFormsForOwner, getFormByToken, getStatusBadgeColor, getStatusDisplayName } from '../forms-query-service';
import { prisma } from '../../prisma';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('FormsQueryService', () => {
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

  describe('getFormsForOwner', () => {
    it('should return forms with default pagination', async () => {
      const mockForms = [
        {
          id: 'form-1',
          token: 'token-123',
          clientEmail: 'client1@example.com',
          clientName: 'John Doe',
          status: 'SENT',
          createdAt: new Date('2023-11-30'),
          updatedAt: new Date('2023-11-30'),
          expiresAt: new Date('2023-12-07'), // Not expired
          formResponse: null,
        },
        {
          id: 'form-2',
          token: 'token-456',
          clientEmail: 'client2@example.com',
          clientName: 'Jane Smith',
          status: 'COMPLETED',
          createdAt: new Date('2023-11-29'),
          updatedAt: new Date('2023-11-30'),
          expiresAt: new Date('2023-12-06'),
          formResponse: {
            submissionId: 'SUB-789012',
            submittedAt: new Date('2023-11-30'),
          },
        },
      ];

      mockPrisma.formInstance.count.mockResolvedValue(2);
      mockPrisma.formInstance.findMany.mockResolvedValue(mockForms);

      const result = await getFormsForOwner(ownerId);

      expect(result).toEqual({
        forms: [
          {
            id: 'form-1',
            token: 'token-123',
            clientEmail: 'client1@example.com',
            clientName: 'John Doe',
            status: 'SENT',
            createdAt: new Date('2023-11-30'),
            updatedAt: new Date('2023-11-30'),
            expiresAt: new Date('2023-12-07'),
            isExpired: false,
            submissionId: undefined,
            submittedAt: undefined,
          },
          {
            id: 'form-2',
            token: 'token-456',
            clientEmail: 'client2@example.com',
            clientName: 'Jane Smith',
            status: 'COMPLETED',
            createdAt: new Date('2023-11-29'),
            updatedAt: new Date('2023-11-30'),
            expiresAt: new Date('2023-12-06'),
            isExpired: false,
            submissionId: 'SUB-789012',
            submittedAt: new Date('2023-11-30'),
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      expect(mockPrisma.formInstance.count).toHaveBeenCalledWith({
        where: { ownerId },
      });

      expect(mockPrisma.formInstance.findMany).toHaveBeenCalledWith({
        where: { ownerId },
        include: {
          formResponse: {
            select: {
              submissionId: true,
              submittedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should handle search filtering', async () => {
      mockPrisma.formInstance.count.mockResolvedValue(0);
      mockPrisma.formInstance.findMany.mockResolvedValue([]);

      await getFormsForOwner(ownerId, { search: 'john' });

      expect(mockPrisma.formInstance.count).toHaveBeenCalledWith({
        where: {
          ownerId,
          OR: [
            {
              clientEmail: {
                contains: 'john',
                mode: 'insensitive',
              },
            },
            {
              clientName: {
                contains: 'john',
                mode: 'insensitive',
              },
            },
          ],
        },
      });
    });

    it('should handle status filtering for EXPIRED', async () => {
      mockPrisma.formInstance.count.mockResolvedValue(0);
      mockPrisma.formInstance.findMany.mockResolvedValue([]);

      await getFormsForOwner(ownerId, { status: 'EXPIRED' });

      expect(mockPrisma.formInstance.count).toHaveBeenCalledWith({
        where: {
          ownerId,
          status: 'SENT',
          expiresAt: {
            lt: new Date('2023-12-01'),
          },
        },
      });
    });

    it('should handle status filtering for SENT (excluding expired)', async () => {
      mockPrisma.formInstance.count.mockResolvedValue(0);
      mockPrisma.formInstance.findMany.mockResolvedValue([]);

      await getFormsForOwner(ownerId, { status: 'SENT' });

      expect(mockPrisma.formInstance.count).toHaveBeenCalledWith({
        where: {
          ownerId,
          status: 'SENT',
          expiresAt: {
            gt: new Date('2023-12-01'),
          },
        },
      });
    });

    it('should handle pagination correctly', async () => {
      mockPrisma.formInstance.count.mockResolvedValue(25);
      mockPrisma.formInstance.findMany.mockResolvedValue([]);

      const result = await getFormsForOwner(ownerId, { page: 3, limit: 5 });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(5);
      expect(result.totalPages).toBe(5);

      expect(mockPrisma.formInstance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (3 - 1) * 5
          take: 5,
        })
      );
    });

    it('should identify expired forms correctly', async () => {
      const mockForms = [
        {
          id: 'form-1',
          token: 'token-123',
          clientEmail: 'client1@example.com',
          clientName: 'John Doe',
          status: 'SENT',
          createdAt: new Date('2023-11-30'),
          updatedAt: new Date('2023-11-30'),
          expiresAt: new Date('2023-11-30'), // Expired (before current date)
          formResponse: null,
        },
      ];

      mockPrisma.formInstance.count.mockResolvedValue(1);
      mockPrisma.formInstance.findMany.mockResolvedValue(mockForms);

      const result = await getFormsForOwner(ownerId);

      expect(result.forms[0].isExpired).toBe(true);
    });
  });

  describe('getFormByToken', () => {
    it('should return form by token', async () => {
      const mockForm = {
        id: 'form-1',
        token: 'token-123',
        clientEmail: 'client@example.com',
        clientName: 'John Doe',
        status: 'SENT',
        createdAt: new Date('2023-11-30'),
        updatedAt: new Date('2023-11-30'),
        expiresAt: new Date('2023-12-07'),
        formResponse: null,
      };

      mockPrisma.formInstance.findFirst.mockResolvedValue(mockForm);

      const result = await getFormByToken('token-123', ownerId);

      expect(result).toEqual({
        id: 'form-1',
        token: 'token-123',
        clientEmail: 'client@example.com',
        clientName: 'John Doe',
        status: 'SENT',
        createdAt: new Date('2023-11-30'),
        updatedAt: new Date('2023-11-30'),
        expiresAt: new Date('2023-12-07'),
        isExpired: false,
        submissionId: undefined,
        submittedAt: undefined,
      });

      expect(mockPrisma.formInstance.findFirst).toHaveBeenCalledWith({
        where: {
          token: 'token-123',
          ownerId,
        },
        include: {
          formResponse: {
            select: {
              submissionId: true,
              submittedAt: true,
            },
          },
        },
      });
    });

    it('should return null when form not found', async () => {
      mockPrisma.formInstance.findFirst.mockResolvedValue(null);

      const result = await getFormByToken('nonexistent', ownerId);

      expect(result).toBeNull();
    });
  });

  describe('getStatusBadgeColor', () => {
    it('should return red for expired forms', () => {
      expect(getStatusBadgeColor('SENT', true)).toBe('bg-red-100 text-red-800');
    });

    it('should return blue for sent forms', () => {
      expect(getStatusBadgeColor('SENT', false)).toBe('bg-blue-100 text-blue-800');
    });

    it('should return yellow for in progress forms', () => {
      expect(getStatusBadgeColor('IN_PROGRESS', false)).toBe('bg-yellow-100 text-yellow-800');
    });

    it('should return green for completed forms', () => {
      expect(getStatusBadgeColor('COMPLETED', false)).toBe('bg-green-100 text-green-800');
    });
  });

  describe('getStatusDisplayName', () => {
    it('should return "Expired" for expired forms', () => {
      expect(getStatusDisplayName('SENT', true)).toBe('Expired');
    });

    it('should return proper display names for non-expired forms', () => {
      expect(getStatusDisplayName('SENT', false)).toBe('Sent');
      expect(getStatusDisplayName('IN_PROGRESS', false)).toBe('In Progress');
      expect(getStatusDisplayName('COMPLETED', false)).toBe('Completed');
    });
  });
});