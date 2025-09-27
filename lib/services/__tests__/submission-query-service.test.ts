import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
  getSubmissionsForOwner,
  getSubmissionById,
  getSubmissionStatusBadge,
} from '../submission-query-service';
import { prisma } from '../../db/prisma';

// Mock Prisma
jest.mock('../../db/prisma', () => ({
  prisma: {
    submission: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

const mockSubmissions = [
  {
    id: 'sub-1',
    formInstanceId: 'form-1',
    submittedAt: new Date('2023-12-01T10:00:00Z'),
    data: { name: 'John Doe', email: 'john@example.com' },
    formInstance: {
      clientEmail: 'john@example.com',
      clientName: 'John Doe',
      ownerId: 'owner-1',
      status: 'COMPLETED',
      template: {
        name: 'Basic Client Intake',
        category: 'Immigration',
      },
    },
  },
  {
    id: 'sub-2',
    formInstanceId: 'form-2',
    submittedAt: new Date('2023-12-02T14:00:00Z'),
    data: { name: 'Jane Smith', email: 'jane@example.com' },
    formInstance: {
      clientEmail: 'jane@example.com',
      clientName: 'Jane Smith',
      ownerId: 'owner-1',
      status: 'COMPLETED',
      template: {
        name: 'Express Entry Assessment',
        category: 'Express Entry',
      },
    },
  },
];

describe('SubmissionQueryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubmissionsForOwner', () => {
    it('should return paginated submissions', async () => {
      (prisma.submission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);
      (prisma.submission.count as jest.Mock).mockResolvedValue(2);

      const result = await getSubmissionsForOwner('owner-1', {
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        submissions: [
          {
            id: 'sub-1',
            formInstanceId: 'form-1',
            clientEmail: 'john@example.com',
            clientName: 'John Doe',
            formTitle: 'Basic Client Intake',
            templateCategory: 'Immigration',
            submittedAt: new Date('2023-12-01T10:00:00Z'),
            data: { name: 'John Doe', email: 'john@example.com' },
          },
          {
            id: 'sub-2',
            formInstanceId: 'form-2',
            clientEmail: 'jane@example.com',
            clientName: 'Jane Smith',
            formTitle: 'Express Entry Assessment',
            templateCategory: 'Express Entry',
            submittedAt: new Date('2023-12-02T14:00:00Z'),
            data: { name: 'Jane Smith', email: 'jane@example.com' },
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply search filter', async () => {
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([mockSubmissions[0]]);
      (prisma.submission.count as jest.Mock).mockResolvedValue(1);

      const result = await getSubmissionsForOwner('owner-1', {
        search: 'john',
        page: 1,
        limit: 10,
      });

      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              {
                formInstance: {
                  clientEmail: {
                    contains: 'john',
                    mode: 'insensitive',
                  },
                },
              },
              {
                formInstance: {
                  clientName: {
                    contains: 'john',
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }),
        })
      );

      expect(result.submissions).toHaveLength(1);
      expect(result.submissions[0].clientName).toBe('John Doe');
    });

    it('should apply date filters', async () => {
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([mockSubmissions[1]]);
      (prisma.submission.count as jest.Mock).mockResolvedValue(1);

      const startDate = new Date('2023-12-02T00:00:00Z');
      const endDate = new Date('2023-12-03T00:00:00Z');

      await getSubmissionsForOwner('owner-1', {
        startDate,
        endDate,
        page: 1,
        limit: 10,
      });

      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            submittedAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });

    it('should handle sorting options', async () => {
      (prisma.submission.findMany as jest.Mock).mockResolvedValue(mockSubmissions);
      (prisma.submission.count as jest.Mock).mockResolvedValue(2);

      // Test sorting by clientEmail
      await getSubmissionsForOwner('owner-1', {
        sortBy: 'clientEmail',
        sortOrder: 'asc',
      });

      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            formInstance: {
              clientEmail: 'asc',
            },
          },
        })
      );

      // Test sorting by formTitle
      await getSubmissionsForOwner('owner-1', {
        sortBy: 'formTitle',
        sortOrder: 'desc',
      });

      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            formInstance: {
              template: {
                name: 'desc',
              },
            },
          },
        })
      );
    });

    it('should handle pagination correctly', async () => {
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([mockSubmissions[1]]);
      (prisma.submission.count as jest.Mock).mockResolvedValue(15);

      const result = await getSubmissionsForOwner('owner-1', {
        page: 2,
        limit: 10,
      });

      expect(prisma.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );

      expect(result.totalPages).toBe(2);
      expect(result.page).toBe(2);
    });

    it('should return empty array for no submissions', async () => {
      (prisma.submission.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.submission.count as jest.Mock).mockResolvedValue(0);

      const result = await getSubmissionsForOwner('owner-1', {
        page: 1,
        limit: 10,
      });

      expect(result.submissions).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('getSubmissionById', () => {
    it('should return submission by id', async () => {
      (prisma.submission.findFirst as jest.Mock).mockResolvedValue({
        ...mockSubmissions[0],
        formInstance: {
          ...mockSubmissions[0].formInstance,
          template: {
            ...mockSubmissions[0].formInstance.template,
            schema: { fields: [] },
          },
        },
      });

      const result = await getSubmissionById('sub-1', 'owner-1');

      expect(prisma.submission.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'sub-1',
          formInstance: {
            ownerId: 'owner-1',
          },
        },
        include: {
          formInstance: {
            include: {
              template: {
                select: {
                  name: true,
                  category: true,
                  schema: true,
                },
              },
            },
          },
        },
      });

      expect(result).toEqual({
        id: 'sub-1',
        formInstanceId: 'form-1',
        clientEmail: 'john@example.com',
        clientName: 'John Doe',
        formTitle: 'Basic Client Intake',
        templateCategory: 'Immigration',
        submittedAt: new Date('2023-12-01T10:00:00Z'),
        data: { name: 'John Doe', email: 'john@example.com' },
      });
    });

    it('should return null for non-existent submission', async () => {
      (prisma.submission.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await getSubmissionById('non-existent', 'owner-1');

      expect(result).toBeNull();
    });

    it('should not return submission for wrong owner', async () => {
      (prisma.submission.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await getSubmissionById('sub-1', 'wrong-owner');

      expect(prisma.submission.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'sub-1',
          formInstance: {
            ownerId: 'wrong-owner',
          },
        },
        include: expect.any(Object),
      });

      expect(result).toBeNull();
    });
  });

  describe('getSubmissionStatusBadge', () => {
    it('should return "New" status for today submissions', () => {
      const submission = {
        id: 'sub-1',
        formInstanceId: 'form-1',
        clientEmail: 'john@example.com',
        clientName: 'John Doe',
        formTitle: 'Basic Client Intake',
        templateCategory: 'Immigration',
        submittedAt: new Date(),
        data: {},
      };

      const result = getSubmissionStatusBadge(submission);

      expect(result).toEqual({
        color: 'bg-green-100 text-green-800',
        text: 'New',
      });
    });

    it('should return "Recent" status for submissions within 7 days', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const submission = {
        id: 'sub-1',
        formInstanceId: 'form-1',
        clientEmail: 'john@example.com',
        clientName: 'John Doe',
        formTitle: 'Basic Client Intake',
        templateCategory: 'Immigration',
        submittedAt: threeDaysAgo,
        data: {},
      };

      const result = getSubmissionStatusBadge(submission);

      expect(result).toEqual({
        color: 'bg-blue-100 text-blue-800',
        text: 'Recent',
      });
    });

    it('should return "Processed" status for older submissions', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const submission = {
        id: 'sub-1',
        formInstanceId: 'form-1',
        clientEmail: 'john@example.com',
        clientName: 'John Doe',
        formTitle: 'Basic Client Intake',
        templateCategory: 'Immigration',
        submittedAt: twoWeeksAgo,
        data: {},
      };

      const result = getSubmissionStatusBadge(submission);

      expect(result).toEqual({
        color: 'bg-gray-100 text-gray-800',
        text: 'Processed',
      });
    });
  });
});