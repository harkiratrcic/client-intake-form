import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { submitForm, validateSubmission, getSubmission } from '../submission-service';
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

describe('submission-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('validateSubmission', () => {
    const basicSchema = {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: {
          type: 'string',
          minLength: 2,
          maxLength: 50,
        },
        email: {
          type: 'string',
          pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
          patternMessage: 'Please enter a valid email address',
        },
        age: {
          type: 'integer',
          minimum: 18,
          maximum: 120,
        },
        subscribe: {
          type: 'boolean',
        },
        interests: {
          type: 'array',
          minItems: 1,
          maxItems: 5,
        },
        country: {
          type: 'string',
          enum: ['CA', 'US', 'UK'],
        },
      },
    };

    it('should validate required fields', () => {
      const result = validateSubmission({}, basicSchema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toEqual([
        { field: 'name', message: 'name is required' },
        { field: 'email', message: 'email is required' },
      ]);
    });

    it('should validate string type and constraints', () => {
      const data = {
        name: 'A', // Too short
        email: 'invalid-email', // Invalid pattern
      };

      const result = validateSubmission(data, basicSchema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([
        { field: 'name', message: 'name must be at least 2 characters' },
        { field: 'email', message: 'Please enter a valid email address' },
      ]);
    });

    it('should validate number constraints', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 150, // Too high
      };

      const result = validateSubmission(data, basicSchema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([
        { field: 'age', message: 'age must be no more than 120' },
      ]);
    });

    it('should validate array constraints', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        interests: [], // Too few items
      };

      const result = validateSubmission(data, basicSchema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([
        { field: 'interests', message: 'interests must have at least 1 items' },
      ]);
    });

    it('should validate enum values', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        country: 'FR', // Not in enum
      };

      const result = validateSubmission(data, basicSchema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([
        { field: 'country', message: 'country must be one of: CA, US, UK' },
      ]);
    });

    it('should pass validation with valid data', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        subscribe: true,
        interests: ['coding', 'music'],
        country: 'CA',
      };

      const result = validateSubmission(data, basicSchema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle invalid schema', () => {
      const result = validateSubmission({ name: 'test' }, null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([
        { field: 'schema', message: 'Invalid schema' },
      ]);
    });
  });

  describe('submitForm', () => {
    const mockFormInstance = {
      id: 'form-1',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2023-01-02T00:00:00.000Z'),
      template: {
        schema: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
          },
        },
      },
      response: null,
    };

    it('should submit form successfully', async () => {
      mockPrisma.formInstance.findUnique.mockResolvedValue(mockFormInstance);
      mockPrisma.formResponse.upsert.mockResolvedValue({
        id: 'response-1',
        submissionId: 'SUB-1672531200000-ABCD12345',
        submittedAt: new Date('2023-01-01T00:00:00.000Z'),
      } as any);

      const result = await submitForm('test-token', { name: 'John Doe' });

      expect(result.success).toBe(true);
      expect(result.submissionId).toBe('SUB-1672531200000-ABCD12345');
      expect(result.submittedAt).toEqual(new Date('2023-01-01T00:00:00.000Z'));

      expect(mockPrisma.formResponse.upsert).toHaveBeenCalledWith({
        where: { instanceId: 'form-1' },
        update: {
          submittedData: { name: 'John Doe' },
          submittedAt: new Date('2023-01-01T00:00:00.000Z'),
          submissionId: expect.stringMatching(/^SUB-\d{13}-[A-Z0-9]{9}$/),
          draftData: {},
        },
        create: {
          instanceId: 'form-1',
          submittedData: { name: 'John Doe' },
          submittedAt: new Date('2023-01-01T00:00:00.000Z'),
          submissionId: expect.stringMatching(/^SUB-\d{13}-[A-Z0-9]{9}$/),
          draftData: {},
        },
      });

      expect(mockPrisma.formInstance.update).toHaveBeenCalledWith({
        where: { id: 'form-1' },
        data: {
          status: 'COMPLETED',
          submittedAt: new Date('2023-01-01T00:00:00.000Z'),
        },
      });
    });

    it('should return error if form not found', async () => {
      mockPrisma.formInstance.findUnique.mockResolvedValue(null);

      const result = await submitForm('invalid-token', { name: 'John Doe' });

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

      const result = await submitForm('test-token', { name: 'John Doe' });

      expect(result).toEqual({
        success: false,
        error: 'Form has expired',
      });
    });

    it('should return error if form is already completed', async () => {
      const completedInstance = { ...mockFormInstance, status: 'COMPLETED' };
      mockPrisma.formInstance.findUnique.mockResolvedValue(completedInstance);

      const result = await submitForm('test-token', { name: 'John Doe' });

      expect(result).toEqual({
        success: false,
        error: 'Form has already been submitted',
      });
    });

    it('should return validation error for invalid data', async () => {
      mockPrisma.formInstance.findUnique.mockResolvedValue(mockFormInstance);

      const result = await submitForm('test-token', {}); // Missing required field

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
      expect(result.error).toContain('name: name is required');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.formInstance.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await submitForm('test-token', { name: 'John Doe' });

      expect(result).toEqual({
        success: false,
        error: 'Failed to submit form',
      });
    });
  });

  describe('getSubmission', () => {
    const mockFormInstanceWithSubmission = {
      id: 'form-1',
      status: 'COMPLETED',
      response: {
        submittedData: { name: 'John Doe', email: 'john@example.com' },
        submittedAt: new Date('2023-01-01T00:00:00.000Z'),
        submissionId: 'SUB-123-ABC',
      },
      template: {
        name: 'Test Form',
      },
      owner: {
        name: 'RCIC Owner',
        email: 'owner@example.com',
        rcicNumber: '12345',
      },
    };

    it('should retrieve submission successfully', async () => {
      mockPrisma.formInstance.findUnique.mockResolvedValue(mockFormInstanceWithSubmission);

      const result = await getSubmission('test-token');

      expect(result).toEqual({
        submissionId: 'SUB-123-ABC',
        submittedAt: new Date('2023-01-01T00:00:00.000Z'),
        submittedData: { name: 'John Doe', email: 'john@example.com' },
        template: { name: 'Test Form' },
        owner: {
          name: 'RCIC Owner',
          email: 'owner@example.com',
          rcicNumber: '12345',
        },
      });

      expect(mockPrisma.formInstance.findUnique).toHaveBeenCalledWith({
        where: { secureToken: 'test-token' },
        include: {
          response: {
            select: {
              submittedData: true,
              submittedAt: true,
              submissionId: true,
            },
          },
          template: {
            select: {
              name: true,
            },
          },
          owner: {
            select: {
              name: true,
              email: true,
              rcicNumber: true,
            },
          },
        },
      });
    });

    it('should return error if form not found', async () => {
      mockPrisma.formInstance.findUnique.mockResolvedValue(null);

      const result = await getSubmission('invalid-token');

      expect(result).toEqual({
        error: 'Form not found',
      });
    });

    it('should return error if form has not been submitted', async () => {
      const draftInstance = {
        ...mockFormInstanceWithSubmission,
        status: 'IN_PROGRESS',
        response: {
          submittedData: null,
        },
      };
      mockPrisma.formInstance.findUnique.mockResolvedValue(draftInstance);

      const result = await getSubmission('test-token');

      expect(result).toEqual({
        error: 'Form has not been submitted',
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.formInstance.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await getSubmission('test-token');

      expect(result).toEqual({
        error: 'Failed to retrieve submission',
      });
    });
  });
});