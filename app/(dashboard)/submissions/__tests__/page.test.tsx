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

// Mock the submission query service
jest.mock('../../../../lib/services/submission-query-service', () => ({
  getSubmissionsForOwner: jest.fn(),
}));

// Mock SubmissionsTableClient component
jest.mock('../submissions-table-client', () => ({
  SubmissionsTableClient: ({ initialData }: { initialData: any }) => (
    <div data-testid="submissions-table-client">
      <div>Submissions Table Component</div>
      <div data-testid="submissions-count">{initialData.submissions.length} submissions</div>
    </div>
  ),
}));

// Import after mocking
import SubmissionsPage, { generateMetadata } from '../page';
import { getSession } from '../../../../lib/auth/get-session';
import { getSubmissionsForOwner } from '../../../../lib/services/submission-query-service';

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
      submittedAt: new Date('2023-12-01'),
      data: { name: 'Client One' },
    },
    {
      id: 'sub-2',
      formInstanceId: 'form-2',
      clientEmail: 'client2@example.com',
      clientName: 'Client Two',
      formTitle: 'Express Entry Assessment',
      templateCategory: 'Express Entry',
      submittedAt: new Date('2023-12-02'),
      data: { name: 'Client Two' },
    },
    {
      id: 'sub-3',
      formInstanceId: 'form-3',
      clientEmail: 'client3@example.com',
      clientName: 'Client Three',
      formTitle: 'Family Sponsorship',
      templateCategory: 'Family Class',
      submittedAt: new Date(), // Today
      data: { name: 'Client Three' },
    },
  ],
  total: 3,
  page: 1,
  limit: 10,
  totalPages: 1,
};

describe('SubmissionsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockGetSubmissionsForOwner.mockResolvedValue(mockSubmissionsResult);
  });

  it('should render submissions page with header and stats', async () => {
    const SubmissionsPageComponent = await SubmissionsPage({ searchParams: {} });
    render(SubmissionsPageComponent);

    expect(screen.getByText('Submissions')).toBeInTheDocument();
    expect(screen.getByText('View and manage all completed form submissions from your clients.')).toBeInTheDocument();
  });

  it('should display correct stats summary', async () => {
    const SubmissionsPageComponent = await SubmissionsPage({ searchParams: {} });
    render(SubmissionsPageComponent);

    // Check stats are displayed by finding stats cards
    const statsCards = document.querySelectorAll('.bg-white.overflow-hidden.shadow.rounded-lg .text-lg.font-medium.text-gray-900');
    expect(statsCards).toHaveLength(4);

    // Convert to array and check values
    const statsValues = Array.from(statsCards).map(card => card.textContent);
    expect(statsValues).toContain('3'); // Total Submissions: 3
    expect(statsValues).toContain('3'); // Form Types: 3 (Immigration, Express Entry, Family Class)
  });

  it('should render SubmissionsTableClient component with data', async () => {
    const SubmissionsPageComponent = await SubmissionsPage({ searchParams: {} });
    render(SubmissionsPageComponent);

    expect(screen.getByTestId('submissions-table-client')).toBeInTheDocument();
    expect(screen.getByText('Submissions Table Component')).toBeInTheDocument();
    expect(screen.getByTestId('submissions-count')).toHaveTextContent('3 submissions');
  });

  it('should pass correct search params to submissions query', async () => {
    await SubmissionsPage({
      searchParams: {
        page: '2',
        search: 'client1',
        startDate: '2023-12-01',
        endDate: '2023-12-31',
        sortBy: 'clientEmail',
        sortOrder: 'asc',
      },
    });

    expect(mockGetSubmissionsForOwner).toHaveBeenCalledWith('owner-1', {
      page: 2,
      limit: 10,
      search: 'client1',
      startDate: new Date('2023-12-01'),
      endDate: expect.any(Date), // End date will have time set to end of day
      sortBy: 'clientEmail',
      sortOrder: 'asc',
    });

    // Check that end date is set to end of day
    const callArgs = (mockGetSubmissionsForOwner as jest.Mock).mock.calls[0][1];
    const endDate = callArgs.endDate;
    expect(endDate.getHours()).toBe(23);
    expect(endDate.getMinutes()).toBe(59);
    expect(endDate.getSeconds()).toBe(59);
  });

  it('should use default values for missing search params', async () => {
    await SubmissionsPage({ searchParams: {} });

    expect(mockGetSubmissionsForOwner).toHaveBeenCalledWith('owner-1', {
      page: 1,
      limit: 10,
      search: '',
      startDate: undefined,
      endDate: undefined,
      sortBy: 'submittedAt',
      sortOrder: 'desc',
    });
  });

  it('should redirect when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const { redirect } = await import('next/navigation');
    const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

    try {
      await SubmissionsPage({ searchParams: {} });
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
      await SubmissionsPage({ searchParams: {} });
    } catch (error) {
      // redirect throws, so we catch it
    }

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('should handle invalid page numbers gracefully', async () => {
    await SubmissionsPage({
      searchParams: {
        page: 'invalid',
      },
    });

    expect(mockGetSubmissionsForOwner).toHaveBeenCalledWith('owner-1', {
      page: 1, // Should default to 1 when invalid
      limit: 10,
      search: '',
      startDate: undefined,
      endDate: undefined,
      sortBy: 'submittedAt',
      sortOrder: 'desc',
    });
  });

  it('should handle invalid date strings gracefully', async () => {
    await SubmissionsPage({
      searchParams: {
        startDate: 'invalid-date',
        endDate: 'also-invalid',
      },
    });

    expect(mockGetSubmissionsForOwner).toHaveBeenCalledWith('owner-1', {
      page: 1,
      limit: 10,
      search: '',
      startDate: undefined, // Should be undefined for invalid dates
      endDate: undefined,
      sortBy: 'submittedAt',
      sortOrder: 'desc',
    });
  });

  it('should calculate "This Week" stat correctly', async () => {
    // Create submissions with specific dates
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 3); // 3 days ago (within a week)

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14); // 2 weeks ago (outside a week)

    const customResult = {
      ...mockSubmissionsResult,
      submissions: [
        { ...mockSubmissionsResult.submissions[0], submittedAt: weekAgo },
        { ...mockSubmissionsResult.submissions[1], submittedAt: twoWeeksAgo },
        { ...mockSubmissionsResult.submissions[2], submittedAt: new Date() }, // Today
      ],
    };

    mockGetSubmissionsForOwner.mockResolvedValue(customResult);

    const SubmissionsPageComponent = await SubmissionsPage({ searchParams: {} });
    render(SubmissionsPageComponent);

    // Should show 2 submissions from this week (3 days ago + today)
    const thisWeekStat = screen.getByText('This Week').closest('.bg-white')?.querySelector('.text-lg.font-medium.text-gray-900');
    expect(thisWeekStat).toHaveTextContent('2');
  });

  it('should calculate "New Today" stat correctly', async () => {
    const SubmissionsPageComponent = await SubmissionsPage({ searchParams: {} });
    render(SubmissionsPageComponent);

    // From the mock data, only sub-3 has today's date
    const todayStat = screen.getByText('New Today').closest('.bg-white')?.querySelector('.text-lg.font-medium.text-gray-900');
    expect(todayStat).toHaveTextContent('1');
  });

  it('should calculate "Form Types" stat correctly', async () => {
    const SubmissionsPageComponent = await SubmissionsPage({ searchParams: {} });
    render(SubmissionsPageComponent);

    // Should count unique template categories: Immigration, Express Entry, Family Class = 3
    const formTypesStat = screen.getByText('Form Types').closest('.bg-white')?.querySelector('.text-lg.font-medium.text-gray-900');
    expect(formTypesStat).toHaveTextContent('3');
  });

  it('should generate correct metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata).toEqual({
      title: 'Submissions - FormFlow Dashboard',
      description: 'View and manage all completed form submissions from your clients.',
    });
  });

  it('should handle empty submissions gracefully', async () => {
    mockGetSubmissionsForOwner.mockResolvedValue({
      submissions: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });

    const SubmissionsPageComponent = await SubmissionsPage({ searchParams: {} });
    render(SubmissionsPageComponent);

    // All stats should show 0
    const statsCards = document.querySelectorAll('.bg-white.overflow-hidden.shadow.rounded-lg .text-lg.font-medium.text-gray-900');
    const statsValues = Array.from(statsCards).map(card => card.textContent);
    expect(statsValues).toContain('0'); // Total submissions
    expect(statsValues).toContain('0'); // Form types

    expect(screen.getByTestId('submissions-count')).toHaveTextContent('0 submissions');
  });
});