import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FormsTable } from '../forms-table';
import { FormInstance } from '../../../lib/services/forms-query-service';

const mockForms: FormInstance[] = [
  {
    id: 'form-1',
    token: 'token-123',
    clientEmail: 'client1@example.com',
    clientName: 'John Doe',
    status: 'SENT',
    createdAt: new Date('2023-11-30T10:00:00Z'),
    updatedAt: new Date('2023-11-30T10:00:00Z'),
    expiresAt: new Date('2023-12-07T10:00:00Z'),
    isExpired: false,
    submissionId: undefined,
    submittedAt: undefined,
  },
  {
    id: 'form-2',
    token: 'token-456',
    clientEmail: 'client2@example.com',
    clientName: 'Jane Smith',
    status: 'COMPLETED',
    createdAt: new Date('2023-11-29T10:00:00Z'),
    updatedAt: new Date('2023-11-30T10:00:00Z'),
    expiresAt: new Date('2023-12-06T10:00:00Z'),
    isExpired: false,
    submissionId: 'SUB-789012',
    submittedAt: new Date('2023-11-30T14:00:00Z'),
  },
  {
    id: 'form-3',
    token: 'token-789',
    clientEmail: 'client3@example.com',
    clientName: 'Bob Wilson',
    status: 'SENT',
    createdAt: new Date('2023-11-28T10:00:00Z'),
    updatedAt: new Date('2023-11-28T10:00:00Z'),
    expiresAt: new Date('2023-11-30T10:00:00Z'),
    isExpired: true,
    submissionId: undefined,
    submittedAt: undefined,
  },
];

const mockProps = {
  forms: mockForms,
  total: 3,
  page: 1,
  limit: 10,
  totalPages: 1,
  onPageChange: jest.fn(),
  onSearch: jest.fn(),
  onStatusFilter: jest.fn(),
  onSort: jest.fn(),
};

describe('FormsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render forms table with data', () => {
    render(<FormsTable {...mockProps} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('client1@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('client2@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    expect(screen.getByText('client3@example.com')).toBeInTheDocument();
  });

  it('should display correct status badges', () => {
    render(<FormsTable {...mockProps} />);

    // Find status badges by class rather than text to avoid conflicts with select options
    const sentBadge = document.querySelector('.bg-blue-100.text-blue-800');
    const completedBadge = document.querySelector('.bg-green-100.text-green-800');
    const expiredBadge = document.querySelector('.bg-red-100.text-red-800');

    expect(sentBadge).toBeInTheDocument();
    expect(completedBadge).toBeInTheDocument();
    expect(expiredBadge).toBeInTheDocument();

    expect(sentBadge).toHaveTextContent('Sent');
    expect(completedBadge).toHaveTextContent('Completed');
    expect(expiredBadge).toHaveTextContent('Expired');
  });

  it('should show submission info when available', () => {
    render(<FormsTable {...mockProps} />);

    expect(screen.getByText(/SUB-789012/)).toBeInTheDocument();
  });

  it('should handle search form submission', async () => {
    render(<FormsTable {...mockProps} />);

    const searchInput = screen.getByPlaceholderText('Search by client name or email...');
    const searchForm = searchInput.closest('form');

    fireEvent.change(searchInput, { target: { value: 'john' } });
    fireEvent.submit(searchForm!);

    await waitFor(() => {
      expect(mockProps.onSearch).toHaveBeenCalledWith('john');
    });
  });

  it('should handle status filter change', () => {
    render(<FormsTable {...mockProps} />);

    const statusFilter = screen.getByDisplayValue('All Status');
    fireEvent.change(statusFilter, { target: { value: 'COMPLETED' } });

    expect(mockProps.onStatusFilter).toHaveBeenCalledWith('COMPLETED');
  });

  it('should handle column sorting', () => {
    render(<FormsTable {...mockProps} />);

    const clientHeader = screen.getByText('Client').closest('th');
    fireEvent.click(clientHeader!);

    expect(mockProps.onSort).toHaveBeenCalledWith('clientEmail', 'desc');
  });

  it('should toggle sort order on repeated column clicks', () => {
    render(<FormsTable {...mockProps} />);

    const clientHeader = screen.getByText('Client').closest('th');

    // First click
    fireEvent.click(clientHeader!);
    expect(mockProps.onSort).toHaveBeenCalledWith('clientEmail', 'desc');

    // Second click should toggle to asc
    fireEvent.click(clientHeader!);
    expect(mockProps.onSort).toHaveBeenCalledWith('clientEmail', 'asc');
  });

  it('should render empty state when no forms', () => {
    const emptyProps = {
      ...mockProps,
      forms: [],
      total: 0,
    };

    render(<FormsTable {...emptyProps} />);

    expect(screen.getByText('No forms found')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating your first form.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create Form/i })).toBeInTheDocument();
  });

  it('should render pagination when multiple pages', () => {
    const paginatedProps = {
      ...mockProps,
      total: 25,
      totalPages: 3,
      page: 2,
    };

    render(<FormsTable {...paginatedProps} />);

    expect(screen.getByText('Showing 11 to 20 of 25 results')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should handle pagination clicks', () => {
    const paginatedProps = {
      ...mockProps,
      total: 25,
      totalPages: 3,
      page: 2,
    };

    render(<FormsTable {...paginatedProps} />);

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(mockProps.onPageChange).toHaveBeenCalledWith(3);
  });

  it('should disable pagination buttons appropriately', () => {
    const firstPageProps = {
      ...mockProps,
      total: 25,
      totalPages: 3,
      page: 1,
    };

    render(<FormsTable {...firstPageProps} />);

    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('should format dates correctly', () => {
    render(<FormsTable {...mockProps} />);

    // Should display formatted dates (exact format may vary by locale)
    expect(screen.getAllByText(/Nov 30, 2023/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Dec 7, 2023/).length).toBeGreaterThan(0);
  });

  it('should render correct action links', () => {
    render(<FormsTable {...mockProps} />);

    // Should have "View Form" links for all forms
    const viewFormLinks = screen.getAllByText('View Form');
    expect(viewFormLinks).toHaveLength(3);

    // Should have "View Submission" link only for completed forms
    const viewSubmissionLinks = screen.getAllByText('View Submission');
    expect(viewSubmissionLinks).toHaveLength(1);
  });

  it('should open form links in new tab', () => {
    render(<FormsTable {...mockProps} />);

    const viewFormLinks = screen.getAllByText('View Form');
    viewFormLinks.forEach(link => {
      expect(link.closest('a')).toHaveAttribute('target', '_blank');
      expect(link.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('should display expired indicator for expired forms', () => {
    render(<FormsTable {...mockProps} />);

    const expiredIndicators = screen.getAllByText('Expired');
    expect(expiredIndicators.length).toBeGreaterThanOrEqual(2); // At least one in status badge and one in expires column
  });
});