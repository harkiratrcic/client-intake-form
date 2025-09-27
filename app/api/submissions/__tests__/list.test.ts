import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '../route';
import { getSession } from '../../../../lib/auth/get-session';
import { getSubmissionsForOwner } from '../../../../lib/services/submission-query-service';

// Mock dependencies
jest.mock('../../../../lib/auth/get-session');
jest.mock('../../../../lib/services/submission-query-service');

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockGetSubmissionsForOwner = getSubmissionsForOwner as jest.MockedFunction<typeof getSubmissionsForOwner>;

const mockSession = {
  token: 'valid-token',
  owner: {
    id: 'owner-1',
    name: 'John Doe',
    email: 'john@example.com',
    rcicNumber: 'R12345',
  },
};

const mockSubmissionsResult = {
  submissions: [
    {
      id: 'sub-1',
      formInstanceId: 'form-1',
      clientEmail: 'client1@example.com',
      clientName: 'Client One',
      formTitle: 'Basic Client Intake',
      templateCategory: 'Immigration',
      submittedAt: new Date('2023-12-01T10:00:00Z'),
      data: { name: 'Client One' },
    },
    {
      id: 'sub-2',
      formInstanceId: 'form-2',
      clientEmail: 'client2@example.com',
      clientName: 'Client Two',
      formTitle: 'Express Entry Assessment',
      templateCategory: 'Express Entry',
      submittedAt: new Date('2023-12-02T14:00:00Z'),
      data: { name: 'Client Two' },
    },
  ],
  total: 2,
  page: 1,
  limit: 10,
  totalPages: 1,
};

describe('GET /api/submissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return submissions for authenticated user', async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockGetSubmissionsForOwner.mockResolvedValue(mockSubmissionsResult);

    const request = new NextRequest('http://localhost:3000/api/submissions');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockSubmissionsResult);
    expect(mockGetSubmissionsForOwner).toHaveBeenCalledWith('owner-1', {
      page: 1,
      limit: 10,
      search: '',
      startDate: undefined,
      endDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    });
  });

  it('should handle pagination parameters', async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockGetSubmissionsForOwner.mockResolvedValue(mockSubmissionsResult);

    const request = new NextRequest('http://localhost:3000/api/submissions?page=2&limit=20');
    await GET(request);

    expect(mockGetSubmissionsForOwner).toHaveBeenCalledWith('owner-1', {
      page: 2,
      limit: 20,
      search: '',
      startDate: undefined,
      endDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    });
  });

  it('should handle search parameter', async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockGetSubmissionsForOwner.mockResolvedValue(mockSubmissionsResult);

    const request = new NextRequest('http://localhost:3000/api/submissions?search=client1');
    await GET(request);

    expect(mockGetSubmissionsForOwner).toHaveBeenCalledWith('owner-1', {
      page: 1,
      limit: 10,
      search: 'client1',
      startDate: undefined,
      endDate: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    });
  });

  it('should handle date filters', async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockGetSubmissionsForOwner.mockResolvedValue(mockSubmissionsResult);

    const request = new NextRequest(
      'http://localhost:3000/api/submissions?startDate=2023-12-01&endDate=2023-12-31'
    );
    await GET(request);

    expect(mockGetSubmissionsForOwner).toHaveBeenCalledWith('owner-1', {
      page: 1,
      limit: 10,
      search: '',
      startDate: new Date('2023-12-01'),
      endDate: expect.any(Date), // End date will have time set to 23:59:59
      sortBy: undefined,
      sortOrder: undefined,
    });

    // Check that end date is set to end of day
    const callArgs = (mockGetSubmissionsForOwner as jest.Mock).mock.calls[0][1];
    const endDate = callArgs.endDate;
    expect(endDate.getHours()).toBe(23);
    expect(endDate.getMinutes()).toBe(59);
    expect(endDate.getSeconds()).toBe(59);
  });

  it('should handle sorting parameters', async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockGetSubmissionsForOwner.mockResolvedValue(mockSubmissionsResult);

    const request = new NextRequest(
      'http://localhost:3000/api/submissions?sortBy=clientEmail&sortOrder=desc'
    );
    await GET(request);

    expect(mockGetSubmissionsForOwner).toHaveBeenCalledWith('owner-1', {
      page: 1,
      limit: 10,
      search: '',
      startDate: undefined,
      endDate: undefined,
      sortBy: 'clientEmail',
      sortOrder: 'desc',
    });
  });

  it('should return 401 for unauthenticated request', async () => {
    mockGetSession.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/submissions');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
    expect(mockGetSubmissionsForOwner).not.toHaveBeenCalled();
  });

  it('should return 401 when session has no owner', async () => {
    mockGetSession.mockResolvedValue({
      token: 'valid-token',
      owner: null,
    });

    const request = new NextRequest('http://localhost:3000/api/submissions');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
    expect(mockGetSubmissionsForOwner).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid date format', async () => {
    mockGetSession.mockResolvedValue(mockSession);

    const request = new NextRequest(
      'http://localhost:3000/api/submissions?startDate=invalid-date'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invalid start date format' });
    expect(mockGetSubmissionsForOwner).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid pagination parameters', async () => {
    mockGetSession.mockResolvedValue(mockSession);

    const request = new NextRequest('http://localhost:3000/api/submissions?page=0&limit=150');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Invalid pagination parameters' });
    expect(mockGetSubmissionsForOwner).not.toHaveBeenCalled();
  });

  it('should handle service errors gracefully', async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockGetSubmissionsForOwner.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/submissions');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
  });

  it('should handle empty results', async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockGetSubmissionsForOwner.mockResolvedValue({
      submissions: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });

    const request = new NextRequest('http://localhost:3000/api/submissions');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.submissions).toEqual([]);
    expect(data.total).toBe(0);
  });
});