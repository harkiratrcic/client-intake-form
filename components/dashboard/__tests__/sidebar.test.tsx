import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '../sidebar';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

import { usePathname } from 'next/navigation';
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all navigation items', () => {
    mockUsePathname.mockReturnValue('/dashboard');

    render(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Forms')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('should highlight active navigation item - dashboard', () => {
    mockUsePathname.mockReturnValue('/dashboard');

    render(<Sidebar />);

    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
    expect(dashboardLink).toHaveClass('bg-indigo-100', 'text-indigo-900');
  });

  it('should highlight active navigation item - forms', () => {
    mockUsePathname.mockReturnValue('/dashboard/forms');

    render(<Sidebar />);

    const formsLink = screen.getByRole('link', { name: /Forms/i });
    expect(formsLink).toHaveClass('bg-indigo-100', 'text-indigo-900');

    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
    expect(dashboardLink).toHaveClass('text-gray-600');
  });

  it('should highlight active navigation item - sub-path', () => {
    mockUsePathname.mockReturnValue('/dashboard/forms/new');

    render(<Sidebar />);

    const formsLink = screen.getByRole('link', { name: /Forms/i });
    expect(formsLink).toHaveClass('bg-indigo-100', 'text-indigo-900');
  });

  it('should render footer information', () => {
    mockUsePathname.mockReturnValue('/dashboard');

    render(<Sidebar />);

    expect(screen.getByText('FormFlow Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Version 1.0')).toBeInTheDocument();
  });

  it('should have correct href attributes for navigation links', () => {
    mockUsePathname.mockReturnValue('/dashboard');

    render(<Sidebar />);

    expect(screen.getByRole('link', { name: /Dashboard/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /Forms/i })).toHaveAttribute('href', '/dashboard/forms');
    expect(screen.getByRole('link', { name: /Templates/i })).toHaveAttribute('href', '/dashboard/templates');
    expect(screen.getByRole('link', { name: /Clients/i })).toHaveAttribute('href', '/dashboard/clients');
    expect(screen.getByRole('link', { name: /Analytics/i })).toHaveAttribute('href', '/dashboard/analytics');
  });
});