import { describe, expect, it, beforeEach, jest } from '@jest/globals';

// Mock the submission service
jest.mock('../../../../../../lib/services/submission-service');

import { submitForm } from '../../../../../../lib/services/submission-service';

const mockSubmitForm = submitForm as jest.MockedFunction<typeof submitForm>;

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: async () => data,
      status: options?.status || 200,
    })),
  },
}));

import { NextResponse } from 'next/server';
const mockNextResponse = NextResponse as jest.Mocked<typeof NextResponse>;

// Import the route handlers after mocks
import { POST } from '../route';

describe('/api/forms/[token]/submit', () => {
  const mockParams = { params: { token: 'test-token' } };

  const createMockRequest = (data: any) => ({
    json: async () => data,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockNextResponse.json.mockImplementation((data, options) => ({
      json: async () => data,
      status: options?.status || 200,
    } as any));
  });

  describe('POST', () => {
    it('should submit form successfully', async () => {
      const mockRequest = createMockRequest({ name: 'John Doe', email: 'john@example.com' });

      mockSubmitForm.mockResolvedValue({
        success: true,
        submissionId: 'SUB-123-ABC',
        submittedAt: new Date('2023-01-01T00:00:00.000Z'),
      });

      await POST(mockRequest as any, mockParams);

      expect(mockSubmitForm).toHaveBeenCalledWith('test-token', {
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(mockNextResponse.json).toHaveBeenCalledWith({
        success: true,
        submissionId: 'SUB-123-ABC',
        submittedAt: new Date('2023-01-01T00:00:00.000Z'),
        message: 'Form submitted successfully',
      });
    });

    it('should return 400 when token is missing', async () => {
      const mockRequest = createMockRequest({ name: 'John Doe' });

      await POST(mockRequest as any, { params: { token: '' } });

      expect(mockSubmitForm).not.toHaveBeenCalled();
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Token is required' },
        { status: 400 }
      );
    });

    it('should return 404 when form not found', async () => {
      const mockRequest = createMockRequest({ name: 'John Doe' });

      mockSubmitForm.mockResolvedValue({
        success: false,
        error: 'Form not found',
      });

      await POST(mockRequest as any, mockParams);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Form not found' },
        { status: 404 }
      );
    });

    it('should return 400 when form has expired', async () => {
      const mockRequest = createMockRequest({ name: 'John Doe' });

      mockSubmitForm.mockResolvedValue({
        success: false,
        error: 'Form has expired',
      });

      await POST(mockRequest as any, mockParams);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Form has expired' },
        { status: 400 }
      );
    });

    it('should return 400 when form has already been submitted', async () => {
      const mockRequest = createMockRequest({ name: 'John Doe' });

      mockSubmitForm.mockResolvedValue({
        success: false,
        error: 'Form has already been submitted',
      });

      await POST(mockRequest as any, mockParams);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Form has already been submitted' },
        { status: 400 }
      );
    });

    it('should return 422 for validation errors', async () => {
      const mockRequest = createMockRequest({ name: '' });

      mockSubmitForm.mockResolvedValue({
        success: false,
        error: 'Validation failed: name: name is required',
      });

      await POST(mockRequest as any, mockParams);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Validation failed: name: name is required' },
        { status: 422 }
      );
    });

    it('should return 500 for other service errors', async () => {
      const mockRequest = createMockRequest({ name: 'John Doe' });

      mockSubmitForm.mockResolvedValue({
        success: false,
        error: 'Database connection failed',
      });

      await POST(mockRequest as any, mockParams);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    });

    it('should return 400 for invalid JSON', async () => {
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new SyntaxError('Invalid JSON')),
      };

      await POST(mockRequest as any, mockParams);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Invalid JSON data' },
        { status: 400 }
      );
    });

    it('should return 500 for unexpected errors', async () => {
      const mockRequest = createMockRequest({ name: 'John Doe' });

      mockSubmitForm.mockRejectedValue(new Error('Unexpected error'));

      await POST(mockRequest as any, mockParams);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { error: 'Internal server error' },
        { status: 500 }
      );
    });
  });
});