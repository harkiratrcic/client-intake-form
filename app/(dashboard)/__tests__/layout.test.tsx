import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock the auth module
jest.mock('../../../lib/auth/get-session', () => ({
  getSession: jest.fn(),
}));

// Import after mocking
import DashboardLayout, { generateMetadata } from '../layout';
import { getSession } from '../../../lib/auth/get-session';
import { redirect } from 'next/navigation';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

const mockOwner = {
  id: 'owner-1',
  name: 'John Doe',
  email: 'john@example.com',
  rcicNumber: 'R12345',
};

const mockSession = {
  token: 'valid-token',
  owner: mockOwner,
};

describe('DashboardLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetch for header component
    global.fetch = jest.fn();
  });

  it('should render dashboard layout when user is authenticated', async () => {
    mockGetSession.mockResolvedValueOnce(mockSession);

    const LayoutComponent = await DashboardLayout({
      children: <div>Dashboard Content</div>
    });

    render(LayoutComponent);

    expect(screen.getByText('FormFlow')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('should redirect to login when user is not authenticated', async () => {
    mockGetSession.mockResolvedValueOnce(null);

    try {
      await DashboardLayout({ children: <div>Dashboard Content</div> });
    } catch (error) {
      // The redirect function throws, so we catch it
    }

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('should redirect to login when session exists but no owner', async () => {
    mockGetSession.mockResolvedValueOnce({
      token: 'valid-token',
      owner: null,
    });

    try {
      await DashboardLayout({ children: <div>Dashboard Content</div> });
    } catch (error) {
      // The redirect function throws, so we catch it
    }

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('should render sidebar navigation', async () => {
    mockGetSession.mockResolvedValueOnce(mockSession);

    const LayoutComponent = await DashboardLayout({
      children: <div>Dashboard Content</div>
    });

    render(LayoutComponent);

    expect(screen.getByText('Forms')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });
});

describe('generateMetadata', () => {
  it('should return correct metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata).toEqual({
      title: 'Dashboard - FormFlow',
      description: 'Immigration consultant dashboard for form management.',
    });
  });
});