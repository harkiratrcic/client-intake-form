import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { saveDraft, getDraft, clearDraft } from '../draft-service';
import { prisma } from '../../prisma';

// Mock Prisma
jest.mock('../../prisma', () => ({
  prisma: {
    formInstance: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    formResponse: {
      upsert: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('draft-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('saveDraft', () => {
    const mockFormInstance = {
      id: 'instance-1',
      status: 'SENT',
      expiresAt: new Date('2023-01-02T00:00:00.000Z'),
      response: null,
    };

    it('should save draft successfully', async () => {
      mockPrisma.formInstance.findUnique.mockResolvedValue(mockFormInstance);
      mockPrisma.formResponse.upsert.mockResolvedValue({
        id: 'response-1',
        instanceId: 'instance-1',
        draftData: { name: 'test' },
        lastSavedAt: new Date('2023-01-01T00:00:00.000Z'),
      } as any);

      const result = await saveDraft('test-token', { name: 'test' });

      expect(result).toEqual({
        success: true,
        lastSavedAt: new Date('2023-01-01T00:00:00.000Z'),
      });

      expect(mockPrisma.formInstance.findUnique).toHaveBeenCalledWith({
        where: { secureToken: 'test-token' },
        select: {
          id: true,
          status: true,
          expiresAt: true,
          response: {
            select: {
              id: true,
            },
          },
        },
      });

      expect(mockPrisma.formResponse.upsert).toHaveBeenCalledWith({
        where: {
          instanceId: 'instance-1',
        },
        update: {
          draftData: { name: 'test' },
          lastSavedAt: new Date('2023-01-01T00:00:00.000Z'),
        },
        create: {
          instanceId: 'instance-1',
          draftData: { name: 'test' },
          lastSavedAt: new Date('2023-01-01T00:00:00.000Z'),
        },
      });
    });

    it('should update form status to IN_PROGRESS when status is SENT', async () => {
      mockPrisma.formInstance.findUnique.mockResolvedValue(mockFormInstance);
      mockPrisma.formResponse.upsert.mockResolvedValue({
        lastSavedAt: new Date('2023-01-01T00:00:00.000Z'),
      } as any);

      await saveDraft('test-token', { name: 'test' });

      expect(mockPrisma.formInstance.update).toHaveBeenCalledWith({
        where: { id: 'instance-1' },
        data: { status: 'IN_PROGRESS' },
      });
    });

    it('should not update form status if already IN_PROGRESS', async () => {
      const inProgressInstance = { ...mockFormInstance, status: 'IN_PROGRESS' };
      mockPrisma.formInstance.findUnique.mockResolvedValue(inProgressInstance);
      mockPrisma.formResponse.upsert.mockResolvedValue({
        lastSavedAt: new Date('2023-01-01T00:00:00.000Z'),
      } as any);

      await saveDraft('test-token', { name: 'test' });

      expect(mockPrisma.formInstance.update).not.toHaveBeenCalled();
    });

    it('should return error if form not found', async () => {
      mockPrisma.formInstance.findUnique.mockResolvedValue(null);

      const result = await saveDraft('invalid-token', { name: 'test' });

      expect(result).toEqual({
        success: false,
        error: 'Form not found',
      });
    });

    it('should return error if form is expired', async () => {
      const expiredInstance = {
        ...mockFormInstance,
        expiresAt: new Date('2022-12-31T00:00:00.000Z'),
      };
      mockPrisma.formInstance.findUnique.mockResolvedValue(expiredInstance);

      const result = await saveDraft('test-token', { name: 'test' });

      expect(result).toEqual({
        success: false,
        error: 'Form has expired',
      });
    });

    it('should return error if form is already completed', async () => {
      const completedInstance = { ...mockFormInstance, status: 'COMPLETED' };
      mockPrisma.formInstance.findUnique.mockResolvedValue(completedInstance);

      const result = await saveDraft('test-token', { name: 'test' });

      expect(result).toEqual({
        success: false,
        error: 'Form has already been submitted',
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.formInstance.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await saveDraft('test-token', { name: 'test' });

      expect(result).toEqual({
        success: false,
        error: 'Failed to save draft',
      });
    });
  });

  describe('getDraft', () => {
    const mockFormInstanceWithResponse = {
      id: 'instance-1',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2023-01-02T00:00:00.000Z'),
      response: {
        draftData: { name: 'test' },
        lastSavedAt: new Date('2023-01-01T00:00:00.000Z'),
      },
    };

    it('should retrieve draft successfully', async () => {
      mockPrisma.formInstance.findUnique.mockResolvedValue(mockFormInstanceWithResponse);

      const result = await getDraft('test-token');

      expect(result).toEqual({
        draftData: { name: 'test' },
        lastSavedAt: new Date('2023-01-01T00:00:00.000Z'),
        status: 'IN_PROGRESS',
      });

      expect(mockPrisma.formInstance.findUnique).toHaveBeenCalledWith({
        where: { secureToken: 'test-token' },
        select: {
          id: true,
          status: true,
          expiresAt: true,
          response: {
            select: {
              draftData: true,
              lastSavedAt: true,
            },
          },
        },
      });
    });

    it('should return empty draft when no response exists', async () => {
      const instanceWithoutResponse = {
        ...mockFormInstanceWithResponse,
        response: null,
      };
      mockPrisma.formInstance.findUnique.mockResolvedValue(instanceWithoutResponse);

      const result = await getDraft('test-token');

      expect(result).toEqual({
        draftData: {},
        lastSavedAt: null,
        status: 'IN_PROGRESS',
      });
    });

    it('should return error if form not found', async () => {
      mockPrisma.formInstance.findUnique.mockResolvedValue(null);

      const result = await getDraft('invalid-token');

      expect(result).toEqual({
        error: 'Form not found',
      });
    });

    it('should return error if form is expired', async () => {
      const expiredInstance = {
        ...mockFormInstanceWithResponse,
        expiresAt: new Date('2022-12-31T00:00:00.000Z'),
      };
      mockPrisma.formInstance.findUnique.mockResolvedValue(expiredInstance);

      const result = await getDraft('test-token');

      expect(result).toEqual({
        error: 'Form has expired',
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.formInstance.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await getDraft('test-token');

      expect(result).toEqual({
        error: 'Failed to retrieve draft',
      });
    });
  });

  describe('clearDraft', () => {
    const mockFormInstance = {
      id: 'instance-1',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2023-01-02T00:00:00.000Z'),
    };

    it('should clear draft successfully', async () => {
      mockPrisma.formInstance.findUnique.mockResolvedValue(mockFormInstance);
      mockPrisma.formResponse.upsert.mockResolvedValue({
        lastSavedAt: new Date('2023-01-01T00:00:00.000Z'),
      } as any);

      const result = await clearDraft('test-token');

      expect(result).toEqual({
        success: true,
        lastSavedAt: new Date('2023-01-01T00:00:00.000Z'),
      });

      expect(mockPrisma.formResponse.upsert).toHaveBeenCalledWith({
        where: {
          instanceId: 'instance-1',
        },
        update: {
          draftData: {},
          lastSavedAt: new Date('2023-01-01T00:00:00.000Z'),
        },
        create: {
          instanceId: 'instance-1',
          draftData: {},
          lastSavedAt: new Date('2023-01-01T00:00:00.000Z'),
        },
      });
    });

    it('should return error if form not found', async () => {
      mockPrisma.formInstance.findUnique.mockResolvedValue(null);

      const result = await clearDraft('invalid-token');

      expect(result).toEqual({
        success: false,
        error: 'Form not found',
      });
    });

    it('should return error if form is expired', async () => {
      const expiredInstance = {
        ...mockFormInstance,
        expiresAt: new Date('2022-12-31T00:00:00.000Z'),
      };
      mockPrisma.formInstance.findUnique.mockResolvedValue(expiredInstance);

      const result = await clearDraft('test-token');

      expect(result).toEqual({
        success: false,
        error: 'Form has expired',
      });
    });

    it('should return error if form is already completed', async () => {
      const completedInstance = { ...mockFormInstance, status: 'COMPLETED' };
      mockPrisma.formInstance.findUnique.mockResolvedValue(completedInstance);

      const result = await clearDraft('test-token');

      expect(result).toEqual({
        success: false,
        error: 'Form has already been submitted',
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.formInstance.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await clearDraft('test-token');

      expect(result).toEqual({
        success: false,
        error: 'Failed to clear draft',
      });
    });
  });
});