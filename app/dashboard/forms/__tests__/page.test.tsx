import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock the auth module
jest.mock('../../../../lib/auth/get-session', () => ({
  getSession: jest.fn(),
}));

// Mock the forms query service
jest.mock('../../../../lib/services/forms-query-service', () => ({
  getFormsForOwner: jest.fn(),
  getStatusBadgeColor: jest.fn((status: string, isExpired: boolean) => {
    if (isExpired && status === 'SENT') return 'bg-red-100 text-red-800';
    if (status === 'SENT') return 'bg-blue-100 text-blue-800';
    if (status === 'COMPLETED') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  }),
  getStatusDisplayName: jest.fn((status: string, isExpired: boolean) => {
    if (isExpired && status === 'SENT') return 'Expired';
    if (status === 'SENT') return 'Sent';
    if (status === 'COMPLETED') return 'Completed';
    return status;
  }),
}));

// Import after mocking
import FormsPage from '../page';
import { getSession } from '../../../../lib/auth/get-session';
import { getFormsForOwner } from '../../../../lib/services/forms-query-service';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockGetFormsForOwner = getFormsForOwner as jest.MockedFunction<typeof getFormsForOwner>;

const mockSession = {
  token: 'valid-token',
  owner: {
    id: 'owner-1',
    name: 'John Doe',
    email: 'john@example.com',
    rcicNumber: 'R12345',
  },
};

const mockFormsResult = {
  forms: [
    {
      id: 'form-1',
      token: 'token-123',
      clientEmail: 'client1@example.com',
      clientName: 'John Client',
      status: 'SENT' as const,
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
      clientName: 'Jane Client',
      status: 'COMPLETED' as const,
      createdAt: new Date('2023-11-29'),
      updatedAt: new Date('2023-11-30'),
      expiresAt: new Date('2023-12-06'),
      isExpired: false,
      submissionId: 'SUB-789012',
      submittedAt: new Date('2023-11-30'),
    },
    {
      id: 'form-3',
      token: 'token-789',
      clientEmail: 'client3@example.com',
      clientName: 'Bob Client',
      status: 'SENT' as const,
      createdAt: new Date('2023-11-28'),
      updatedAt: new Date('2023-11-28'),
      expiresAt: new Date('2023-11-30'),
      isExpired: true,
      submissionId: undefined,
      submittedAt: undefined,
    },
  ],
  total: 3,
  page: 1,
  limit: 10,
  totalPages: 1,
};

describe('FormsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockGetFormsForOwner.mockResolvedValue(mockFormsResult);
  });

  it('should render forms page with header and stats', async () => {
    const FormsPageComponent = await FormsPage({ searchParams: {} });
    render(FormsPageComponent);

    expect(screen.getByText('Forms')).toBeInTheDocument();
    expect(screen.getByText('Manage all client intake forms sent from your practice.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create New Form/i })).toBeInTheDocument();
  });

  it('should display correct stats summary', async () => {
    const FormsPageComponent = await FormsPage({ searchParams: {} });
    render(FormsPageComponent);

    // Check stats are displayed by finding stats cards
    const statsCards = document.querySelectorAll('.bg-white.shadow.rounded-lg .text-lg.font-medium.text-gray-900');
    expect(statsCards).toHaveLength(4);

    // Convert to array and check values
    const statsValues = Array.from(statsCards).map(card => card.textContent);
    expect(statsValues).toContain('1'); // Active Forms: 1 (form-1 is SENT and not expired)
    expect(statsValues).toContain('0'); // In Progress: 0
    expect(statsValues).toContain('1'); // Completed: 1 (form-2)
    expect(statsValues).toContain('1'); // Expired: 1 (form-3)
  });

  it('should pass correct search params to forms query', async () => {
    await FormsPage({
      searchParams: {
        page: '2',
        search: 'john',
        status: 'SENT',
        sortBy: 'clientEmail',
        sortOrder: 'asc',
      },
    });

    expect(mockGetFormsForOwner).toHaveBeenCalledWith('owner-1', {
      page: 2,
      limit: 10,
      search: 'john',
      status: 'SENT',
      sortBy: 'clientEmail',
      sortOrder: 'asc',
    });
  });

  it('should use default values for missing search params', async () => {
    await FormsPage({ searchParams: {} });

    expect(mockGetFormsForOwner).toHaveBeenCalledWith('owner-1', {
      page: 1,
      limit: 10,
      search: '',
      status: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });

  it('should redirect when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const { redirect } = await import('next/navigation');
    const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

    try {
      await FormsPage({ searchParams: {} });
    } catch (error) {
      // redirect throws, so we catch it
    }

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('should redirect when session has no owner', async () => {
    mockGetSession.mockResolvedValue({
      token: 'valid-token',
      owner: null,
    });

    const { redirect } = await import('next/navigation');
    const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

    try {
      await FormsPage({ searchParams: {} });
    } catch (error) {
      // redirect throws, so we catch it
    }

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('should render forms table with correct props', async () => {
    const FormsPageComponent = await FormsPage({ searchParams: {} });
    render(FormsPageComponent);

    // The FormsTableClient should be rendered with initial data
    expect(screen.getByText('John Client')).toBeInTheDocument();
    expect(screen.getByText('Jane Client')).toBeInTheDocument();
    expect(screen.getByText('Bob Client')).toBeInTheDocument();
  });

  it('should handle invalid page numbers gracefully', async () => {
    await FormsPage({
      searchParams: {
        page: 'invalid',
      },
    });

    expect(mockGetFormsForOwner).toHaveBeenCalledWith('owner-1', {
      page: 1, // Should default to 1 when invalid
      limit: 10,
      search: '',
      status: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });

  it('should generate correct metadata', async () => {
    const { generateMetadata } = await import('../page');
    const metadata = await generateMetadata();

    expect(metadata).toEqual({
      title: 'Forms - FormFlow Dashboard',
      description: 'Manage client intake forms sent from your immigration practice.',
    });
  });
});