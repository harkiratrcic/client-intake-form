import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubmissionViewer } from '../submission-viewer';

const mockSubmission = {
  id: 'sub-1',
  formInstanceId: 'form-1',
  clientEmail: 'john@example.com',
  clientName: 'John Doe',
  formTitle: 'Basic Client Intake',
  templateCategory: 'Immigration',
  submittedAt: new Date('2023-12-01T10:00:00Z'),
  data: {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1985-06-15',
    nationality: 'Canadian',
    currentStatus: 'Work Permit',
    address: '123 Main St, Toronto, ON',
    immigrationGoals: 'Obtain permanent residence through Express Entry program',
  },
  formInstance: {
    template: {
      schema: {
        fields: [
          { name: 'fullName', type: 'text', label: 'Full Name', required: true },
          { name: 'email', type: 'email', label: 'Email Address', required: true },
          { name: 'phone', type: 'tel', label: 'Phone Number', required: true },
          { name: 'dateOfBirth', type: 'date', label: 'Date of Birth', required: true },
          { name: 'nationality', type: 'text', label: 'Nationality', required: true },
          { name: 'currentStatus', type: 'select', label: 'Current Immigration Status', required: true, options: ['Citizen', 'Permanent Resident', 'Work Permit', 'Student Permit'] },
          { name: 'address', type: 'textarea', label: 'Current Address', required: true },
          { name: 'immigrationGoals', type: 'textarea', label: 'Immigration Goals', required: true },
        ],
      },
    },
  },
};

describe('SubmissionViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render submission information correctly', () => {
    render(<SubmissionViewer submission={mockSubmission} />);

    expect(screen.getByText('Basic Client Intake')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Immigration')).toBeInTheDocument();
  });

  it('should display breadcrumb navigation', () => {
    render(<SubmissionViewer submission={mockSubmission} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Submissions')).toBeInTheDocument();
    expect(screen.getByText('Submission Details')).toBeInTheDocument();
  });

  it('should render form data fields with proper labels', () => {
    render(<SubmissionViewer submission={mockSubmission} />);

    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Phone Number')).toBeInTheDocument();
    expect(screen.getByText('Date of Birth')).toBeInTheDocument();
    expect(screen.getByText('Nationality')).toBeInTheDocument();
    expect(screen.getByText('Current Immigration Status')).toBeInTheDocument();
    expect(screen.getByText('Current Address')).toBeInTheDocument();
    expect(screen.getByText('Immigration Goals')).toBeInTheDocument();
  });

  it('should display form data values correctly', () => {
    render(<SubmissionViewer submission={mockSubmission} />);

    expect(screen.getAllByText('John Doe')).toHaveLength(2); // Name appears in header and form data
    expect(screen.getAllByText('john@example.com')).toHaveLength(2); // Email appears in info and form data
    expect(screen.getByText('+1 (555) 123-4567')).toBeInTheDocument();
    expect(screen.getByText('Canadian')).toBeInTheDocument();
    expect(screen.getByText('Work Permit')).toBeInTheDocument();
    expect(screen.getByText('123 Main St, Toronto, ON')).toBeInTheDocument();
    expect(screen.getByText('Obtain permanent residence through Express Entry program')).toBeInTheDocument();
  });

  it('should format date fields properly', () => {
    render(<SubmissionViewer submission={mockSubmission} />);

    // Date of birth should be formatted as readable date
    expect(screen.getByText('June 15, 1985')).toBeInTheDocument();
  });

  it('should display submission metadata', () => {
    render(<SubmissionViewer submission={mockSubmission} />);

    expect(screen.getByText('Submission Information')).toBeInTheDocument();
    expect(screen.getByText('Form Data')).toBeInTheDocument();
    expect(screen.getByText('sub-1')).toBeInTheDocument(); // Submission ID
  });

  it('should show correct status badge for recent submission', () => {
    const recentSubmission = {
      ...mockSubmission,
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    };

    render(<SubmissionViewer submission={recentSubmission} />);

    const statusBadge = document.querySelector('.bg-blue-100.text-blue-800');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveTextContent('Recent');
  });

  it('should show correct status badge for new submission', () => {
    const newSubmission = {
      ...mockSubmission,
      submittedAt: new Date(), // Today
    };

    render(<SubmissionViewer submission={newSubmission} />);

    const statusBadge = document.querySelector('.bg-green-100.text-green-800');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveTextContent('New');
  });

  it('should show correct status badge for old submission', () => {
    const oldSubmission = {
      ...mockSubmission,
      submittedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
    };

    render(<SubmissionViewer submission={oldSubmission} />);

    const statusBadge = document.querySelector('.bg-gray-100.text-gray-800');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveTextContent('Reviewed');
  });

  it('should render print button', () => {
    render(<SubmissionViewer submission={mockSubmission} />);

    const printButton = screen.getByText('Print');
    expect(printButton).toBeInTheDocument();
  });

  it('should handle empty or null field values', () => {
    const submissionWithEmptyFields = {
      ...mockSubmission,
      data: {
        fullName: 'John Doe',
        email: '',
        phone: null,
        dateOfBirth: undefined,
      },
    };

    render(<SubmissionViewer submission={submissionWithEmptyFields} />);

    // Should show em dash for empty values
    const emDashes = screen.getAllByText('—');
    expect(emDashes.length).toBeGreaterThan(0);
  });

  it('should handle boolean field values', () => {
    const submissionWithBooleans = {
      ...mockSubmission,
      data: {
        ...mockSubmission.data,
        hasChildren: true,
        isMarried: false,
      },
    };

    render(<SubmissionViewer submission={submissionWithBooleans} />);

    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('should handle array field values', () => {
    const submissionWithArrays = {
      ...mockSubmission,
      data: {
        ...mockSubmission.data,
        languages: ['English', 'French', 'Spanish'],
      },
    };

    render(<SubmissionViewer submission={submissionWithArrays} />);

    expect(screen.getByText('English, French, Spanish')).toBeInTheDocument();
  });

  it('should handle fields without schema labels', () => {
    const submissionWithoutSchema = {
      ...mockSubmission,
      data: {
        customField: 'Custom Value',
        anotherField: 'Another Value',
      },
      formInstance: undefined,
    };

    render(<SubmissionViewer submission={submissionWithoutSchema} />);

    // Should generate labels from field names
    expect(screen.getByText('Custom Field')).toBeInTheDocument();
    expect(screen.getByText('Another Field')).toBeInTheDocument();
    expect(screen.getByText('Custom Value')).toBeInTheDocument();
    expect(screen.getByText('Another Value')).toBeInTheDocument();
  });

  it('should render breadcrumb links correctly', () => {
    render(<SubmissionViewer submission={mockSubmission} />);

    const dashboardLink = screen.getByLabelText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');

    const submissionsLink = screen.getByText('Submissions').closest('a');
    expect(submissionsLink).toHaveAttribute('href', '/dashboard/submissions');
  });

  it('should display no data message when submission data is empty', () => {
    const emptySubmission = {
      ...mockSubmission,
      data: {},
    };

    render(<SubmissionViewer submission={emptySubmission} />);

    expect(screen.getByText('No form data available.')).toBeInTheDocument();
  });

  it('should format object field values as JSON', () => {
    const submissionWithObjects = {
      ...mockSubmission,
      data: {
        ...mockSubmission.data,
        complexData: {
          nested: {
            value: 'test',
            number: 123,
          },
        },
      },
    };

    render(<SubmissionViewer submission={submissionWithObjects} />);

    // Should render formatted JSON
    expect(screen.getByText(/nested/)).toBeInTheDocument();
    expect(screen.getByText(/test/)).toBeInTheDocument();
  });

  it('should sort fields according to schema order', () => {
    render(<SubmissionViewer submission={mockSubmission} />);

    const fieldElements = screen.getAllByText(/Full Name|Email Address|Phone Number/);

    // Full Name should appear before Email Address based on schema order
    const fullNameIndex = Array.from(document.querySelectorAll('dt')).findIndex(
      el => el.textContent === 'Full Name'
    );
    const emailIndex = Array.from(document.querySelectorAll('dt')).findIndex(
      el => el.textContent === 'Email Address'
    );

    expect(fullNameIndex).toBeLessThan(emailIndex);
  });
});