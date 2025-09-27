import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Confirmation } from '../confirmation';

// Mock window.print
Object.defineProperty(window, 'print', {
  value: jest.fn(),
});

describe('Confirmation', () => {
  const mockSubmission = {
    submissionId: 'SUB-1672531200000-ABCD12345',
    submittedAt: new Date('2023-01-01T12:00:00.000Z'),
    submittedData: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1-555-0123',
    },
    template: {
      name: 'Initial Assessment Form',
    },
    owner: {
      name: 'RCIC Immigration Consultant',
      email: 'consultant@immigration.ca',
      rcicNumber: 'R123456',
    },
  };

  const mockToken = 'test-token-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display success header with form name', () => {
    render(<Confirmation submission={mockSubmission} token={mockToken} />);

    expect(screen.getByText('Form Submitted Successfully!')).toBeInTheDocument();
    expect(screen.getByText(/Thank you for completing your Initial Assessment Form/)).toBeInTheDocument();
  });

  it('should display submission reference number', () => {
    render(<Confirmation submission={mockSubmission} token={mockToken} />);

    expect(screen.getByText('Reference Number')).toBeInTheDocument();
    expect(screen.getByText('SUB-1672531200000-ABCD12345')).toBeInTheDocument();
  });

  it('should display formatted submission date', () => {
    render(<Confirmation submission={mockSubmission} token={mockToken} />);

    expect(screen.getByText('Submitted On')).toBeInTheDocument();
    // Check if date is displayed (format may vary by locale)
    expect(screen.getByText(/Sunday, January 1, 2023/)).toBeInTheDocument();
  });

  it('should display form type and status', () => {
    render(<Confirmation submission={mockSubmission} token={mockToken} />);

    expect(screen.getByText('Form Type')).toBeInTheDocument();
    expect(screen.getByText('Initial Assessment Form')).toBeInTheDocument();

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('should display RCIC consultant information', () => {
    render(<Confirmation submission={mockSubmission} token={mockToken} />);

    expect(screen.getByText('Your Immigration Consultant')).toBeInTheDocument();
    expect(screen.getByText('RCIC Immigration Consultant')).toBeInTheDocument();
    expect(screen.getByText('RCIC #R123456')).toBeInTheDocument();

    const emailLink = screen.getByText('consultant@immigration.ca');
    expect(emailLink).toHaveAttribute('href', 'mailto:consultant@immigration.ca');
  });

  it('should display important information section', () => {
    render(<Confirmation submission={mockSubmission} token={mockToken} />);

    expect(screen.getByText('Important Information')).toBeInTheDocument();
    expect(screen.getByText(/Save your reference number/)).toBeInTheDocument();
    expect(screen.getByText(/Your consultant typically responds/)).toBeInTheDocument();
    expect(screen.getByText(/Check your email regularly/)).toBeInTheDocument();
    expect(screen.getByText(/This form can no longer be modified/)).toBeInTheDocument();
  });

  it('should have working print button', () => {
    render(<Confirmation submission={mockSubmission} token={mockToken} />);

    const printButton = screen.getByText('Print Confirmation');
    fireEvent.click(printButton);

    expect(window.print).toHaveBeenCalled();
  });

  it('should have contact consultant email link with pre-filled content', () => {
    render(<Confirmation submission={mockSubmission} token={mockToken} />);

    const contactLink = screen.getByText('Contact Consultant');
    expect(contactLink).toHaveAttribute('href', expect.stringContaining('mailto:consultant@immigration.ca'));
    expect(contactLink).toHaveAttribute('href', expect.stringContaining('subject=Regarding Form Submission SUB-1672531200000-ABCD12345'));
    expect(contactLink).toHaveAttribute('href', expect.stringContaining('RCIC Immigration Consultant'));
    expect(contactLink).toHaveAttribute('href', expect.stringContaining('Initial Assessment Form'));
  });

  it('should display all required visual elements', () => {
    render(<Confirmation submission={mockSubmission} token={mockToken} />);

    // Check for success checkmark icon (by looking for SVG elements)
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);

    // Check for status badge
    const statusBadge = screen.getByText('Completed');
    expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('should display consultant contact with proper styling', () => {
    render(<Confirmation submission={mockSubmission} token={mockToken} />);

    const consultantSection = screen.getByText('Your Immigration Consultant').closest('div');
    expect(consultantSection).toHaveClass('bg-blue-50');

    const rcicBadge = screen.getByText('RCIC #R123456');
    expect(rcicBadge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('should handle long reference numbers properly', () => {
    const longRefSubmission = {
      ...mockSubmission,
      submissionId: 'SUB-1672531200000-VERYLONGREFCODE123456789',
    };

    render(<Confirmation submission={longRefSubmission} token={mockToken} />);

    const refNumber = screen.getByText('SUB-1672531200000-VERYLONGREFCODE123456789');
    expect(refNumber).toHaveClass('font-mono');
  });
});