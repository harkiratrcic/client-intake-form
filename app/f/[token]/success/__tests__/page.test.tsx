import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import SuccessPage from '../page';

// Mock the submission service
jest.mock('../../../../../lib/services/submission-service');

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

// Mock the Confirmation component
jest.mock('../../../../../components/form/confirmation', () => ({
  Confirmation: ({ submission, token }: any) => (
    <div data-testid="confirmation">
      <div data-testid="submission-id">{submission.submissionId}</div>
      <div data-testid="token">{token}</div>
      <div data-testid="template-name">{submission.template.name}</div>
      <div data-testid="owner-name">{submission.owner.name}</div>
    </div>
  ),
}));

import { getSubmission } from '../../../../../lib/services/submission-service';

const mockGetSubmission = getSubmission as jest.MockedFunction<typeof getSubmission>;
const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;

describe('SuccessPage', () => {
  const mockParams = { token: 'test-token' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display confirmation when submission exists', async () => {
    const mockSubmission = {
      submissionId: 'SUB-123-ABC',
      submittedAt: new Date('2023-01-01T00:00:00.000Z'),
      submittedData: { name: 'John Doe', email: 'john@example.com' },
      template: {
        name: 'Initial Assessment Form',
      },
      owner: {
        name: 'RCIC Consultant',
        email: 'consultant@example.com',
        rcicNumber: '12345',
      },
    };

    mockGetSubmission.mockResolvedValue(mockSubmission);

    const component = await SuccessPage({ params: mockParams });
    render(component as React.ReactElement);

    expect(screen.getByTestId('confirmation')).toBeInTheDocument();
    expect(screen.getByTestId('submission-id')).toHaveTextContent('SUB-123-ABC');
    expect(screen.getByTestId('token')).toHaveTextContent('test-token');
    expect(screen.getByTestId('template-name')).toHaveTextContent('Initial Assessment Form');
    expect(screen.getByTestId('owner-name')).toHaveTextContent('RCIC Consultant');

    expect(mockGetSubmission).toHaveBeenCalledWith('test-token');
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it('should call notFound when form not found', async () => {
    mockGetSubmission.mockResolvedValue({ error: 'Form not found' });

    await SuccessPage({ params: mockParams });

    expect(mockGetSubmission).toHaveBeenCalledWith('test-token');
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('should show redirect message when form not submitted', async () => {
    mockGetSubmission.mockResolvedValue({ error: 'Form has not been submitted' });

    const component = await SuccessPage({ params: mockParams });
    render(component as React.ReactElement);

    expect(screen.getByText('Form Not Submitted Yet')).toBeInTheDocument();
    expect(screen.getByText('This form has not been submitted. Please complete and submit the form first.')).toBeInTheDocument();

    const goToFormLink = screen.getByText('Go to Form');
    expect(goToFormLink).toHaveAttribute('href', '/f/test-token');

    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it('should show error message for other errors', async () => {
    mockGetSubmission.mockResolvedValue({ error: 'Database connection failed' });

    const component = await SuccessPage({ params: mockParams });
    render(component as React.ReactElement);

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Database connection failed')).toBeInTheDocument();

    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it('should generate correct metadata for successful submission', async () => {
    const mockSubmission = {
      submissionId: 'SUB-123-ABC',
      submittedAt: new Date('2023-01-01T00:00:00.000Z'),
      submittedData: { name: 'John Doe' },
      template: {
        name: 'Initial Assessment Form',
      },
      owner: {
        name: 'RCIC Consultant',
        email: 'consultant@example.com',
        rcicNumber: '12345',
      },
    };

    mockGetSubmission.mockResolvedValue(mockSubmission);

    const { generateMetadata } = require('../page');
    const metadata = await generateMetadata({ params: mockParams });

    expect(metadata).toEqual({
      title: 'Submission Confirmed - Initial Assessment Form',
      description: 'Your Initial Assessment Form has been successfully submitted. Reference: SUB-123-ABC',
    });
  });

  it('should generate default metadata for errors', async () => {
    mockGetSubmission.mockResolvedValue({ error: 'Form not found' });

    const { generateMetadata } = require('../page');
    const metadata = await generateMetadata({ params: mockParams });

    expect(metadata).toEqual({
      title: 'Submission Status',
    });
  });
});