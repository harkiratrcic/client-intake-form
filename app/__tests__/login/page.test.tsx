import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockRedirect = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  redirect: mockRedirect,
}));

// Mock the auth module
jest.mock('../../../lib/auth/get-session', () => ({
  getSession: jest.fn(),
}));

// Import after mocking
import LoginPage from '../../login/page';
import { getSession } from '../../../lib/auth/get-session';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login page when user is not authenticated', async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const LoginPageComponent = await LoginPage();
    render(LoginPageComponent);

    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('should redirect to dashboard when user is already authenticated', async () => {
    mockGetSession.mockResolvedValueOnce({
      token: 'valid-token',
      owner: {
        id: 'owner-1',
        name: 'John Doe',
        email: 'john@example.com',
        rcicNumber: 'R12345',
      },
    });

    await LoginPage();

    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });
});