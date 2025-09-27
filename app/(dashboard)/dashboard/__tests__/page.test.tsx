import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock the auth module
jest.mock('../../../../lib/auth/get-session', () => ({
  getSession: jest.fn(),
}));

// Mock the stats service
jest.mock('../../../../lib/services/stats-service', () => ({
  getDashboardStats: jest.fn(),
  getRecentSubmissions: jest.fn(),
  getExpiringForms: jest.fn(),
}));

// Import after mocking
import DashboardPage from '../page';
import { getSession } from '../../../../lib/auth/get-session';
import { getDashboardStats, getRecentSubmissions, getExpiringForms } from '../../../../lib/services/stats-service';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockGetDashboardStats = getDashboardStats as jest.MockedFunction<typeof getDashboardStats>;
const mockGetRecentSubmissions = getRecentSubmissions as jest.MockedFunction<typeof getRecentSubmissions>;
const mockGetExpiringForms = getExpiringForms as jest.MockedFunction<typeof getExpiringForms>;

const mockSession = {
  token: 'valid-token',
  owner: {
    id: 'owner-1',
    name: 'John Doe',
    email: 'john@example.com',
    rcicNumber: 'R12345',
  },
};

const mockStats = {
  totalForms: 15,
  activeForms: 8,
  submittedForms: 6,
  expiredForms: 1,
};

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockGetDashboardStats.mockResolvedValue(mockStats);
    mockGetRecentSubmissions.mockResolvedValue([]);
    mockGetExpiringForms.mockResolvedValue([]);
  });

  it('should render dashboard with stats', async () => {
    const DashboardComponent = await DashboardPage();
    render(DashboardComponent);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Welcome back, John Doe/)).toBeInTheDocument();

    expect(screen.getByText('Total Forms')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    expect(screen.getByText('Active Forms')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();

    expect(screen.getByText('Submitted Forms')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();

    expect(screen.getByText('Expired Forms')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should render recent submissions section', async () => {
    const DashboardComponent = await DashboardPage();
    render(DashboardComponent);

    expect(screen.getByText('Recent Submissions')).toBeInTheDocument();
    expect(screen.getByText('No submissions yet')).toBeInTheDocument();
  });

  it('should render expiring forms section', async () => {
    const DashboardComponent = await DashboardPage();
    render(DashboardComponent);

    expect(screen.getByText('Forms Expiring Soon')).toBeInTheDocument();
    expect(screen.getByText('No forms expiring soon')).toBeInTheDocument();
  });

  it('should render quick actions', async () => {
    const DashboardComponent = await DashboardPage();
    render(DashboardComponent);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Create New Form')).toBeInTheDocument();
    expect(screen.getByText('Manage Templates')).toBeInTheDocument();
    expect(screen.getByText('View Clients')).toBeInTheDocument();
    expect(screen.getByText('View Analytics')).toBeInTheDocument();
  });

  it('should render recent submissions when available', async () => {
    mockGetRecentSubmissions.mockResolvedValue([
      {
        id: 'sub-1',
        submissionId: 'SUB-123456',
        submittedAt: new Date('2023-12-01'),
        formInstance: {
          clientEmail: 'client@example.com',
          createdAt: new Date('2023-11-30')
        }
      }
    ]);

    const DashboardComponent = await DashboardPage();
    render(DashboardComponent);

    expect(screen.getByText('client@example.com')).toBeInTheDocument();
    expect(screen.getByText(/SUB-123456/)).toBeInTheDocument();
  });

  it('should render expiring forms when available', async () => {
    mockGetExpiringForms.mockResolvedValue([
      {
        id: 'form-1',
        token: 'token-123',
        clientEmail: 'expiring@example.com',
        createdAt: new Date('2023-11-30'),
        expiresAt: new Date('2023-12-02'),
        daysUntilExpiry: 2
      }
    ]);

    const DashboardComponent = await DashboardPage();
    render(DashboardComponent);

    expect(screen.getByText('expiring@example.com')).toBeInTheDocument();
    expect(screen.getByText(/in 2 days/)).toBeInTheDocument();
  });
});