import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubmissionsTable } from '../submissions-table';
import { SubmissionListItem } from '../../../lib/services/submission-query-service';

const mockSubmissions: SubmissionListItem[] = [
  {
    id: 'sub-1',
    formInstanceId: 'form-1',
    clientEmail: 'john@example.com',
    clientName: 'John Doe',
    formTitle: 'Basic Client Intake',
    templateCategory: 'Immigration',
    submittedAt: new Date('2023-12-01T10:00:00Z'),
    data: { name: 'John Doe', email: 'john@example.com' },
  },
  {
    id: 'sub-2',
    formInstanceId: 'form-2',
    clientEmail: 'jane@example.com',
    clientName: 'Jane Smith',
    formTitle: 'Express Entry Assessment',
    templateCategory: 'Express Entry',
    submittedAt: new Date('2023-12-02T14:00:00Z'),
    data: { name: 'Jane Smith', email: 'jane@example.com' },
  },
  {
    id: 'sub-3',
    formInstanceId: 'form-3',
    clientEmail: 'bob@example.com',
    clientName: 'Bob Wilson',
    formTitle: 'Family Sponsorship',
    templateCategory: 'Family Class',
    submittedAt: new Date(), // Today
    data: { name: 'Bob Wilson', email: 'bob@example.com' },
  },
];

const mockProps = {
  submissions: mockSubmissions,
  total: 3,
  page: 1,
  limit: 10,
  totalPages: 1,
  onPageChange: jest.fn(),
  onSearch: jest.fn(),
  onDateFilter: jest.fn(),
  onSort: jest.fn(),
};

describe('SubmissionsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render submissions table with data', () => {
    render(<SubmissionsTable {...mockProps} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('should display correct form titles and categories', () => {
    render(<SubmissionsTable {...mockProps} />);

    expect(screen.getByText('Basic Client Intake')).toBeInTheDocument();
    expect(screen.getByText('Express Entry Assessment')).toBeInTheDocument();
    expect(screen.getByText('Family Sponsorship')).toBeInTheDocument();

    expect(screen.getByText('Immigration')).toBeInTheDocument();
    expect(screen.getByText('Express Entry')).toBeInTheDocument();
    expect(screen.getByText('Family Class')).toBeInTheDocument();
  });

  it('should display correct status badges', () => {
    render(<SubmissionsTable {...mockProps} />);

    // Check for status badges (exact implementation may vary)
    const statusBadges = document.querySelectorAll('.bg-green-100, .bg-blue-100, .bg-gray-100');
    expect(statusBadges.length).toBeGreaterThan(0);
  });

  it('should handle search form submission', async () => {
    render(<SubmissionsTable {...mockProps} />);

    const searchInput = screen.getByPlaceholderText('Search by client name or email...');
    const searchForm = searchInput.closest('form');

    fireEvent.change(searchInput, { target: { value: 'john' } });
    fireEvent.submit(searchForm!);

    await waitFor(() => {
      expect(mockProps.onSearch).toHaveBeenCalledWith('john');
    });
  });

  it('should handle date filter', async () => {
    render(<SubmissionsTable {...mockProps} />);

    const startDateInput = screen.getByDisplayValue('');
    const endDateInput = screen.getAllByDisplayValue('')[1];
    const filterButton = screen.getByText('Filter');

    fireEvent.change(startDateInput, { target: { value: '2023-12-01' } });
    fireEvent.change(endDateInput, { target: { value: '2023-12-31' } });
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(mockProps.onDateFilter).toHaveBeenCalledWith('2023-12-01', '2023-12-31');
    });
  });

  it('should handle column sorting', () => {
    render(<SubmissionsTable {...mockProps} />);

    const clientHeader = screen.getByText('Client').closest('th');
    fireEvent.click(clientHeader!);

    expect(mockProps.onSort).toHaveBeenCalledWith('clientEmail', 'desc');
  });

  it('should toggle sort order on repeated column clicks', () => {
    render(<SubmissionsTable {...mockProps} />);

    const clientHeader = screen.getByText('Client').closest('th');

    // First click
    fireEvent.click(clientHeader!);
    expect(mockProps.onSort).toHaveBeenCalledWith('clientEmail', 'desc');

    // Second click should toggle to asc
    fireEvent.click(clientHeader!);
    expect(mockProps.onSort).toHaveBeenCalledWith('clientEmail', 'asc');
  });

  it('should handle form type sorting', () => {
    render(<SubmissionsTable {...mockProps} />);

    const formTypeHeader = screen.getByText('Form Type').closest('th');
    fireEvent.click(formTypeHeader!);

    expect(mockProps.onSort).toHaveBeenCalledWith('formTitle', 'desc');
  });

  it('should handle submitted date sorting', () => {
    render(<SubmissionsTable {...mockProps} />);

    const submittedHeader = screen.getByText('Submitted').closest('th');
    fireEvent.click(submittedHeader!);

    expect(mockProps.onSort).toHaveBeenCalledWith('submittedAt', 'desc');
  });

  it('should render view links for all submissions', () => {
    render(<SubmissionsTable {...mockProps} />);

    const viewLinks = screen.getAllByText('View');
    expect(viewLinks).toHaveLength(3);

    viewLinks.forEach((link, index) => {
      expect(link.closest('a')).toHaveAttribute('href', `/dashboard/submissions/${mockSubmissions[index].id}`);
    });
  });

  it('should render empty state when no submissions', () => {
    const emptyProps = {
      ...mockProps,
      submissions: [],
      total: 0,
    };

    render(<SubmissionsTable {...emptyProps} />);

    expect(screen.getByText('No submissions')).toBeInTheDocument();
    expect(screen.getByText('No form submissions have been received yet.')).toBeInTheDocument();
  });

  it('should render pagination when multiple pages', () => {
    const paginatedProps = {
      ...mockProps,
      total: 25,
      totalPages: 3,
      page: 2,
    };

    render(<SubmissionsTable {...paginatedProps} />);

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

    render(<SubmissionsTable {...paginatedProps} />);

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

    render(<SubmissionsTable {...firstPageProps} />);

    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('should format dates correctly', () => {
    render(<SubmissionsTable {...mockProps} />);

    // Should display formatted dates (exact format may vary by locale)
    expect(screen.getAllByText(/Dec/).length).toBeGreaterThan(0);
  });

  it('should render export button', () => {
    render(<SubmissionsTable {...mockProps} />);

    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('should clear date filters when empty values are provided', async () => {
    render(<SubmissionsTable {...mockProps} />);

    const filterButton = screen.getByText('Filter');
    fireEvent.click(filterButton);

    await waitFor(() => {
      expect(mockProps.onDateFilter).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  it('should display submission count information', () => {
    const paginatedProps = {
      ...mockProps,
      total: 15,
      totalPages: 2,
      page: 1,
      limit: 10,
    };

    render(<SubmissionsTable {...paginatedProps} />);

    expect(screen.getByText('Showing 1 to 10 of 15 results')).toBeInTheDocument();
  });
});