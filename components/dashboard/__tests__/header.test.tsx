import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from '../header';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

const mockOwner = {
  id: 'owner-1',
  name: 'John Doe',
  email: 'john@example.com',
  rcicNumber: 'R12345',
};

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render header with owner information', () => {
    render(<Header owner={mockOwner} />);

    expect(screen.getByText('FormFlow')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('RCIC #R12345')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('should handle logout successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<Header owner={mockOwner} />);

    const logoutButton = screen.getByText('Sign out');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
      });
    });
  });

  it('should handle logout failure', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Logout failed' }),
    } as Response);

    render(<Header owner={mockOwner} />);

    const logoutButton = screen.getByText('Sign out');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Logout failed');
    });

    consoleSpy.mockRestore();
  });

  it('should handle logout network error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<Header owner={mockOwner} />);

    const logoutButton = screen.getByText('Sign out');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});