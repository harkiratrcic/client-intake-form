import { describe, expect, it, beforeEach, jest } from '@jest/globals';

// Mock the draft service
jest.mock('../../../../../../lib/services/draft-service');

import { saveDraft, getDraft } from '../../../../../../lib/services/draft-service';

const mockSaveDraft = saveDraft as jest.MockedFunction<typeof saveDraft>;
const mockGetDraft = getDraft as jest.MockedFunction<typeof getDraft>;

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
import { POST, GET } from '../route';

describe('/api/forms/[token]/draft', () => {
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
    it('should save draft successfully', async () => {
      const mockRequest = createMockRequest({ name: 'John Doe', email: 'john@example.com' });

      mockSaveDraft.mockResolvedValue({
        success: true,
        lastSavedAt: new Date('2023-01-01T00:00:00.000Z'),
      });

      await POST(mockRequest as any, mockParams);

      expect(mockSaveDraft).toHaveBeenCalledWith('test-token', {
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(mockNextResponse.json).toHaveBeenCalledWith({
        success: true,
        lastSavedAt: new Date('2023-01-01T00:00:00.000Z'),
        message: 'Draft saved successfully',
      });
    });

    it('should return 400 when token is missing', async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ name: 'John Doe' }),
      } as unknown as NextRequest;

      const response = await POST(mockRequest, { params: { token: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Token is required',
      });

      expect(mockSaveDraft).not.toHaveBeenCalled();
    });

    it('should return 404 when form not found', async () => {
      const mockRequest = new NextRequest('http://localhost/api/forms/invalid-token/draft', {
        method: 'POST',
        body: JSON.stringify({ name: 'John Doe' }),
      });

      mockSaveDraft.mockResolvedValue({
        success: false,
        error: 'Form not found',
      });

      const response = await POST(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: 'Form not found',
      });
    });

    it('should return 400 when form has expired', async () => {
      const mockRequest = new NextRequest('http://localhost/api/forms/test-token/draft', {
        method: 'POST',
        body: JSON.stringify({ name: 'John Doe' }),
      });

      mockSaveDraft.mockResolvedValue({
        success: false,
        error: 'Form has expired',
      });

      const response = await POST(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Form has expired',
      });
    });

    it('should return 400 when form has already been submitted', async () => {
      const mockRequest = new NextRequest('http://localhost/api/forms/test-token/draft', {
        method: 'POST',
        body: JSON.stringify({ name: 'John Doe' }),
      });

      mockSaveDraft.mockResolvedValue({
        success: false,
        error: 'Form has already been submitted',
      });

      const response = await POST(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Form has already been submitted',
      });
    });

    it('should return 500 for other service errors', async () => {
      const mockRequest = new NextRequest('http://localhost/api/forms/test-token/draft', {
        method: 'POST',
        body: JSON.stringify({ name: 'John Doe' }),
      });

      mockSaveDraft.mockResolvedValue({
        success: false,
        error: 'Database connection failed',
      });

      const response = await POST(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Database connection failed',
      });
    });

    it('should return 400 for invalid JSON', async () => {
      const mockRequest = new NextRequest('http://localhost/api/forms/test-token/draft', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid JSON data',
      });
    });

    it('should return 500 for unexpected errors', async () => {
      const mockRequest = new NextRequest('http://localhost/api/forms/test-token/draft', {
        method: 'POST',
        body: JSON.stringify({ name: 'John Doe' }),
      });

      mockSaveDraft.mockRejectedValue(new Error('Unexpected error'));

      const response = await POST(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Internal server error',
      });
    });
  });

  describe('GET', () => {
    it('should retrieve draft successfully', async () => {
      const mockRequest = new NextRequest('http://localhost/api/forms/test-token/draft', {
        method: 'GET',
      });

      mockGetDraft.mockResolvedValue({
        draftData: { name: 'John Doe', email: 'john@example.com' },
        lastSavedAt: new Date('2023-01-01T00:00:00.000Z'),
        status: 'IN_PROGRESS',
      });

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        draftData: { name: 'John Doe', email: 'john@example.com' },
        lastSavedAt: '2023-01-01T00:00:00.000Z',
        status: 'IN_PROGRESS',
      });

      expect(mockGetDraft).toHaveBeenCalledWith('test-token');
    });

    it('should return 400 when token is missing', async () => {
      const mockRequest = new NextRequest('http://localhost/api/forms//draft', {
        method: 'GET',
      });

      const response = await GET(mockRequest, { params: { token: '' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Token is required',
      });

      expect(mockGetDraft).not.toHaveBeenCalled();
    });

    it('should return 404 when form not found', async () => {
      const mockRequest = new NextRequest('http://localhost/api/forms/invalid-token/draft', {
        method: 'GET',
      });

      mockGetDraft.mockResolvedValue({
        error: 'Form not found',
      });

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: 'Form not found',
      });
    });

    it('should return 400 when form has expired', async () => {
      const mockRequest = new NextRequest('http://localhost/api/forms/test-token/draft', {
        method: 'GET',
      });

      mockGetDraft.mockResolvedValue({
        error: 'Form has expired',
      });

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Form has expired',
      });
    });

    it('should return 500 for other service errors', async () => {
      const mockRequest = new NextRequest('http://localhost/api/forms/test-token/draft', {
        method: 'GET',
      });

      mockGetDraft.mockResolvedValue({
        error: 'Database connection failed',
      });

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Database connection failed',
      });
    });

    it('should return 500 for unexpected errors', async () => {
      const mockRequest = new NextRequest('http://localhost/api/forms/test-token/draft', {
        method: 'GET',
      });

      mockGetDraft.mockRejectedValue(new Error('Unexpected error'));

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Internal server error',
      });
    });

    it('should handle null lastSavedAt', async () => {
      const mockRequest = new NextRequest('http://localhost/api/forms/test-token/draft', {
        method: 'GET',
      });

      mockGetDraft.mockResolvedValue({
        draftData: {},
        lastSavedAt: null,
        status: 'SENT',
      });

      const response = await GET(mockRequest, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        draftData: {},
        lastSavedAt: null,
        status: 'SENT',
      });
    });
  });
});