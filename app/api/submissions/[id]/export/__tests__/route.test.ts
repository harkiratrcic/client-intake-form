import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GET } from '../route';

// Mock NextRequest
const createMockRequest = (url: string) => ({
  url,
  searchParams: new URL(url).searchParams,
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(''),
  headers: new Map(),
  method: 'GET',
});

// Mock the auth module
jest.mock('../../../../../../lib/auth/get-session', () => ({
  getSession: jest.fn(),
}));

// Mock the submission query service
jest.mock('../../../../../../lib/services/submission-query-service', () => ({
  getSubmissionById: jest.fn(),
}));

// Mock the export service
jest.mock('../../../../../../lib/services/export-service', () => ({
  generateSingleSubmissionCsv: jest.fn(),
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: global.NextResponse,
}));

import { getSession } from '../../../../../../lib/auth/get-session';
import { getSubmissionById } from '../../../../../../lib/services/submission-query-service';
import { generateSingleSubmissionCsv } from '../../../../../../lib/services/export-service';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockGetSubmissionById = getSubmissionById as jest.MockedFunction<typeof getSubmissionById>;
const mockGenerateSingleSubmissionCsv = generateSingleSubmissionCsv as jest.MockedFunction<typeof generateSingleSubmissionCsv>;

const mockSession = {
  token: 'valid-token',
  owner: {
    id: 'owner-1',
    name: 'John Doe',
    email: 'john@example.com',
    rcicNumber: 'R12345',
  },
};

const mockSubmission = {
  id: 'sub-1',
  formInstanceId: 'form-1',
  clientEmail: 'client@example.com',
  clientName: 'Test Client',
  formTitle: 'Basic Client Intake',
  templateCategory: 'Immigration',
  submittedAt: new Date('2023-12-01T10:00:00Z'),
  data: {
    fullName: 'Test Client',
    email: 'client@example.com',
  },
};

const mockCsvResult = {
  content: 'Field,Value\nFull Name,Test Client\nEmail,client@example.com',
  filename: 'submission-Test-Client-2023-12-01.csv',
  contentType: 'text/csv; charset=utf-8',
};

describe('/api/submissions/[id]/export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockGetSubmissionById.mockResolvedValue(mockSubmission);
    mockGenerateSingleSubmissionCsv.mockReturnValue(mockCsvResult);
  });

  describe('GET', () => {
    it('should export single submission CSV with default options', async () => {
      const request = createMockRequest('http://localhost:3000/api/submissions/sub-1/export') as any;

      const response = await GET(request, { params: { id: 'sub-1' } });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(response.headers.get('Content-Disposition')).toContain('submission-Test-Client-2023-12-01.csv');

      expect(mockGetSubmissionById).toHaveBeenCalledWith('sub-1', 'owner-1');
      expect(mockGenerateSingleSubmissionCsv).toHaveBeenCalledWith(mockSubmission, {
        includeMetadata: true,
        includeFormData: true,
        dateFormat: 'localized',
      });
    });

    it('should handle export options from query parameters', async () => {
      const url = new URL('http://localhost:3000/api/submissions/sub-1/export');
      url.searchParams.set('includeMetadata', 'false');
      url.searchParams.set('includeFormData', 'true');
      url.searchParams.set('dateFormat', 'iso');

      const request = createMockRequest(url.toString()) as any;

      await GET(request, { params: { id: 'sub-1' } });

      expect(mockGenerateSingleSubmissionCsv).toHaveBeenCalledWith(mockSubmission, {
        includeMetadata: false,
        includeFormData: true,
        dateFormat: 'iso',
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetSession.mockResolvedValue(null);

      const request = createMockRequest('http://localhost:3000/api/submissions/sub-1/export') as any;

      const response = await GET(request, { params: { id: 'sub-1' } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session has no owner', async () => {
      mockGetSession.mockResolvedValue({
        token: 'valid-token',
        owner: null,
      });

      const request = createMockRequest('http://localhost:3000/api/submissions/sub-1/export') as any;

      const response = await GET(request, { params: { id: 'sub-1' } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when submission does not exist', async () => {
      mockGetSubmissionById.mockResolvedValue(null);

      const request = createMockRequest('http://localhost:3000/api/submissions/non-existent/export') as any;

      const response = await GET(request, { params: { id: 'non-existent' } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Submission not found');
    });

    it('should return 500 when an error occurs', async () => {
      mockGetSubmissionById.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('http://localhost:3000/api/submissions/sub-1/export') as any;

      const response = await GET(request, { params: { id: 'sub-1' } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to export submission');
    });

    it('should set proper cache control headers', async () => {
      const request = createMockRequest('http://localhost:3000/api/submissions/sub-1/export') as any;

      const response = await GET(request, { params: { id: 'sub-1' } });

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });

    it('should handle different submission IDs correctly', async () => {
      const request = createMockRequest('http://localhost:3000/api/submissions/different-id/export') as any;

      await GET(request, { params: { id: 'different-id' } });

      expect(mockGetSubmissionById).toHaveBeenCalledWith('different-id', 'owner-1');
    });

    it('should ensure owner-based access control', async () => {
      const differentOwnerSession = {
        ...mockSession,
        owner: {
          ...mockSession.owner,
          id: 'different-owner',
        },
      };

      mockGetSession.mockResolvedValue(differentOwnerSession);

      const request = createMockRequest('http://localhost:3000/api/submissions/sub-1/export') as any;

      await GET(request, { params: { id: 'sub-1' } });

      expect(mockGetSubmissionById).toHaveBeenCalledWith('sub-1', 'different-owner');
    });

    it('should return CSV content in response body', async () => {
      const request = createMockRequest('http://localhost:3000/api/submissions/sub-1/export') as any;

      const response = await GET(request, { params: { id: 'sub-1' } });

      const content = await response.text();
      expect(content).toBe(mockCsvResult.content);
    });
  });
});