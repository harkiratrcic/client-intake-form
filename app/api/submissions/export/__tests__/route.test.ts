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
jest.mock('../../../../../lib/auth/get-session', () => ({
  getSession: jest.fn(),
}));

// Mock the submission query service
jest.mock('../../../../../lib/services/submission-query-service', () => ({
  getSubmissionsForOwner: jest.fn(),
}));

// Mock the export service
jest.mock('../../../../../lib/services/export-service', () => ({
  generateSubmissionsCsv: jest.fn(),
  generateFormFieldsSummary: jest.fn(),
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: global.NextResponse,
}));

import { getSession } from '../../../../../lib/auth/get-session';
import { getSubmissionsForOwner } from '../../../../../lib/services/submission-query-service';
import { generateSubmissionsCsv, generateFormFieldsSummary } from '../../../../../lib/services/export-service';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockGetSubmissionsForOwner = getSubmissionsForOwner as jest.MockedFunction<typeof getSubmissionsForOwner>;
const mockGenerateSubmissionsCsv = generateSubmissionsCsv as jest.MockedFunction<typeof generateSubmissionsCsv>;
const mockGenerateFormFieldsSummary = generateFormFieldsSummary as jest.MockedFunction<typeof generateFormFieldsSummary>;

const mockSession = {
  token: 'valid-token',
  owner: {
    id: 'owner-1',
    name: 'John Doe',
    email: 'john@example.com',
    rcicNumber: 'R12345',
  },
};

const mockSubmissions = [
  {
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
  },
];

const mockSubmissionsResult = {
  submissions: mockSubmissions,
  total: 1,
  totalPages: 1,
  currentPage: 1,
  limit: 10000,
};

const mockCsvResult = {
  content: 'Name,Email\nTest Client,client@example.com',
  filename: 'submissions-2023-12-01.csv',
  contentType: 'text/csv; charset=utf-8',
};

describe('/api/submissions/export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockGetSubmissionsForOwner.mockResolvedValue(mockSubmissionsResult);
    mockGenerateSubmissionsCsv.mockReturnValue(mockCsvResult);
    mockGenerateFormFieldsSummary.mockReturnValue(mockCsvResult);
  });

  describe('GET', () => {
    it('should export submissions CSV with default options', async () => {
      const request = createMockRequest('http://localhost:3000/api/submissions/export') as any;

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(response.headers.get('Content-Disposition')).toContain('submissions-2023-12-01.csv');

      expect(mockGetSubmissionsForOwner).toHaveBeenCalledWith('owner-1', {
        search: undefined,
        formInstanceId: undefined,
        templateCategory: undefined,
        status: undefined,
        submittedAfter: undefined,
        submittedBefore: undefined,
        page: 1,
        limit: 10000,
      });

      expect(mockGenerateSubmissionsCsv).toHaveBeenCalledWith(mockSubmissions, {
        includeMetadata: true,
        includeFormData: true,
        dateFormat: 'localized',
        flattenData: true,
      });
    });

    it('should handle export options from query parameters', async () => {
      const url = new URL('http://localhost:3000/api/submissions/export');
      url.searchParams.set('includeMetadata', 'false');
      url.searchParams.set('includeFormData', 'true');
      url.searchParams.set('dateFormat', 'iso');
      url.searchParams.set('flattenData', 'false');

      const request = createMockRequest(url.toString()) as any;

      await GET(request);

      expect(mockGenerateSubmissionsCsv).toHaveBeenCalledWith(mockSubmissions, {
        includeMetadata: false,
        includeFormData: true,
        dateFormat: 'iso',
        flattenData: false,
      });
    });

    it('should handle search and filter parameters', async () => {
      const url = new URL('http://localhost:3000/api/submissions/export');
      url.searchParams.set('search', 'test client');
      url.searchParams.set('formInstanceId', 'form-1');
      url.searchParams.set('templateCategory', 'Immigration');
      url.searchParams.set('status', 'completed');
      url.searchParams.set('submittedAfter', '2023-11-01');
      url.searchParams.set('submittedBefore', '2023-12-31');

      const request = createMockRequest(url.toString()) as any;

      await GET(request);

      expect(mockGetSubmissionsForOwner).toHaveBeenCalledWith('owner-1', {
        search: 'test client',
        formInstanceId: 'form-1',
        templateCategory: 'Immigration',
        status: 'completed',
        submittedAfter: new Date('2023-11-01'),
        submittedBefore: new Date('2023-12-31'),
        page: 1,
        limit: 10000,
      });
    });

    it('should export fields summary when type is fields-summary', async () => {
      const url = new URL('http://localhost:3000/api/submissions/export');
      url.searchParams.set('type', 'fields-summary');

      const request = createMockRequest(url.toString()) as any;

      await GET(request);

      expect(mockGenerateFormFieldsSummary).toHaveBeenCalledWith(mockSubmissions);
      expect(mockGenerateSubmissionsCsv).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockGetSession.mockResolvedValue(null);

      const request = createMockRequest('http://localhost:3000/api/submissions/export') as any;

      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session has no owner', async () => {
      mockGetSession.mockResolvedValue({
        token: 'valid-token',
        owner: null,
      });

      const request = createMockRequest('http://localhost:3000/api/submissions/export') as any;

      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 500 when an error occurs', async () => {
      mockGetSubmissionsForOwner.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest('http://localhost:3000/api/submissions/export') as any;

      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to export submissions');
    });

    it('should set proper cache control headers', async () => {
      const request = createMockRequest('http://localhost:3000/api/submissions/export') as any;

      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('Pragma')).toBe('no-cache');
      expect(response.headers.get('Expires')).toBe('0');
    });

    it('should handle invalid date parameters gracefully', async () => {
      const url = new URL('http://localhost:3000/api/submissions/export');
      url.searchParams.set('submittedAfter', 'invalid-date');
      url.searchParams.set('submittedBefore', 'invalid-date');

      const request = createMockRequest(url.toString()) as any;

      await GET(request);

      expect(mockGetSubmissionsForOwner).toHaveBeenCalledWith('owner-1', {
        search: undefined,
        formInstanceId: undefined,
        templateCategory: undefined,
        status: undefined,
        submittedAfter: expect.any(Date), // Will be invalid Date
        submittedBefore: expect.any(Date), // Will be invalid Date
        page: 1,
        limit: 10000,
      });
    });
  });
});