import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock Next.js navigation
const mockRedirect = jest.fn();
const mockNotFound = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: mockRedirect,
  notFound: mockNotFound,
}));

// Mock the auth module
jest.mock('../../../../../lib/auth/get-session', () => ({
  getSession: jest.fn(),
}));

// Mock the submission query service
jest.mock('../../../../../lib/services/submission-query-service', () => ({
  getSubmissionById: jest.fn(),
}));

// Mock Prisma
jest.mock('../../../../../lib/db/prisma', () => ({
  prisma: {
    submission: {
      findFirst: jest.fn(),
    },
  },
}));

// Mock SubmissionViewer component
jest.mock('../../../../../components/dashboard/submission-viewer', () => ({
  SubmissionViewer: ({ submission }: { submission: any }) => (
    <div data-testid="submission-viewer">
      <div>Submission Viewer Component</div>
      <div data-testid="submission-title">{submission.formTitle}</div>
      <div data-testid="client-name">{submission.clientName}</div>
    </div>
  ),
}));

// Import after mocking
import SubmissionDetailPage, { generateMetadata } from '../page';
import { getSession } from '../../../../../lib/auth/get-session';
import { getSubmissionById } from '../../../../../lib/services/submission-query-service';
import { prisma } from '../../../../../lib/db/prisma';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockGetSubmissionById = getSubmissionById as jest.MockedFunction<typeof getSubmissionById>;
const mockPrismaFindFirst = prisma.submission.findFirst as jest.MockedFunction<typeof prisma.submission.findFirst>;

const mockSession = {
  token: 'valid-token',
  owner: {
    id: 'owner-1',
    name: 'John Doe',
    email: 'john@example.com',
    rcicNumber: 'R12345',
  },
};

const mockSubmission = {
  id: 'sub-1',
  formInstanceId: 'form-1',
  clientEmail: 'client@example.com',
  clientName: 'Test Client',
  formTitle: 'Basic Client Intake',
  templateCategory: 'Immigration',
  submittedAt: new Date('2023-12-01T10:00:00Z'),
  data: {
    fullName: 'Test Client',
    email: 'client@example.com',
  },
};

const mockSubmissionWithSchema = {
  id: 'sub-1',
  formInstanceId: 'form-1',
  submittedAt: new Date('2023-12-01T10:00:00Z'),
  data: {
    fullName: 'Test Client',
    email: 'client@example.com',
  },
  formInstance: {
    template: {
      name: 'Basic Client Intake',
      category: 'Immigration',
      schema: {
        fields: [
          { name: 'fullName', type: 'text', label: 'Full Name', required: true },
          { name: 'email', type: 'email', label: 'Email Address', required: true },
        ],
      },
    },
  },
};

describe('SubmissionDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
    mockGetSubmissionById.mockResolvedValue(mockSubmission);
    mockPrismaFindFirst.mockResolvedValue(mockSubmissionWithSchema);
  });

  it('should render submission detail page with viewer component', async () => {
    const SubmissionDetailPageComponent = await SubmissionDetailPage({
      params: { id: 'sub-1' },
    });
    render(SubmissionDetailPageComponent);

    expect(screen.getByTestId('submission-viewer')).toBeInTheDocument();
    expect(screen.getByText('Submission Viewer Component')).toBeInTheDocument();
    expect(screen.getByTestId('submission-title')).toHaveTextContent('Basic Client Intake');
    expect(screen.getByTestId('client-name')).toHaveTextContent('Test Client');
  });

  it('should fetch submission with correct parameters', async () => {
    await SubmissionDetailPage({
      params: { id: 'sub-1' },
    });

    expect(mockGetSubmissionById).toHaveBeenCalledWith('sub-1', 'owner-1');
    expect(mockPrismaFindFirst).toHaveBeenCalledWith({
      where: {
        id: 'sub-1',
        formInstance: {
          ownerId: 'owner-1',
        },
      },
      include: {
        formInstance: {
          include: {
            template: {
              select: {
                name: true,
                category: true,
                schema: true,
              },
            },
          },
        },
      },
    });
  });

  it('should redirect when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    try {
      await SubmissionDetailPage({
        params: { id: 'sub-1' },
      });
    } catch (error) {
      // redirect throws, so we catch it
    }

    expect(mockRedirect).toHaveBeenCalledWith('/login');
    expect(mockGetSubmissionById).not.toHaveBeenCalled();
  });

  it('should redirect when session has no owner', async () => {
    mockGetSession.mockResolvedValue({
      token: 'valid-token',
      owner: null,
    });

    try {
      await SubmissionDetailPage({
        params: { id: 'sub-1' },
      });
    } catch (error) {
      // redirect throws, so we catch it
    }

    expect(mockRedirect).toHaveBeenCalledWith('/login');
    expect(mockGetSubmissionById).not.toHaveBeenCalled();
  });

  it('should call notFound when submission does not exist', async () => {
    mockGetSubmissionById.mockResolvedValue(null);

    try {
      await SubmissionDetailPage({
        params: { id: 'non-existent' },
      });
    } catch (error) {
      // notFound throws, so we catch it
    }

    expect(mockGetSubmissionById).toHaveBeenCalledWith('non-existent', 'owner-1');
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('should pass enriched submission data to viewer', async () => {
    const SubmissionDetailPageComponent = await SubmissionDetailPage({
      params: { id: 'sub-1' },
    });
    render(SubmissionDetailPageComponent);

    // The component should receive the submission with schema data
    expect(screen.getByTestId('submission-viewer')).toBeInTheDocument();
  });

  it('should handle case where prisma returns null', async () => {
    mockPrismaFindFirst.mockResolvedValue(null);

    const SubmissionDetailPageComponent = await SubmissionDetailPage({
      params: { id: 'sub-1' },
    });
    render(SubmissionDetailPageComponent);

    // Should still render but without schema data
    expect(screen.getByTestId('submission-viewer')).toBeInTheDocument();
    expect(screen.getByTestId('submission-title')).toHaveTextContent('Basic Client Intake');
  });

  describe('generateMetadata', () => {
    it('should generate correct metadata for valid submission', async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetSubmissionById.mockResolvedValue(mockSubmission);

      const metadata = await generateMetadata({
        params: { id: 'sub-1' },
      });

      expect(metadata).toEqual({
        title: 'Basic Client Intake - Test Client | FormFlow Dashboard',
        description: 'View submission details for Basic Client Intake submitted by Test Client.',
      });
    });

    it('should generate default metadata when user is not authenticated', async () => {
      mockGetSession.mockResolvedValue(null);

      const metadata = await generateMetadata({
        params: { id: 'sub-1' },
      });

      expect(metadata).toEqual({
        title: 'Submission Details - FormFlow Dashboard',
        description: 'View detailed form submission information.',
      });
      expect(mockGetSubmissionById).not.toHaveBeenCalled();
    });

    it('should generate not found metadata when submission does not exist', async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetSubmissionById.mockResolvedValue(null);

      const metadata = await generateMetadata({
        params: { id: 'non-existent' },
      });

      expect(metadata).toEqual({
        title: 'Submission Not Found - FormFlow Dashboard',
        description: 'The requested submission could not be found.',
      });
    });

    it('should call getSubmissionById with correct parameters', async () => {
      mockGetSession.mockResolvedValue(mockSession);
      mockGetSubmissionById.mockResolvedValue(mockSubmission);

      await generateMetadata({
        params: { id: 'test-id' },
      });

      expect(mockGetSubmissionById).toHaveBeenCalledWith('test-id', 'owner-1');
    });
  });

  it('should handle different submission IDs correctly', async () => {
    await SubmissionDetailPage({
      params: { id: 'different-id' },
    });

    expect(mockGetSubmissionById).toHaveBeenCalledWith('different-id', 'owner-1');
    expect(mockPrismaFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'different-id',
          formInstance: {
            ownerId: 'owner-1',
          },
        },
      })
    );
  });

  it('should ensure owner-based access control', async () => {
    const differentOwnerSession = {
      ...mockSession,
      owner: {
        ...mockSession.owner,
        id: 'different-owner',
      },
    };

    mockGetSession.mockResolvedValue(differentOwnerSession);

    await SubmissionDetailPage({
      params: { id: 'sub-1' },
    });

    expect(mockGetSubmissionById).toHaveBeenCalledWith('sub-1', 'different-owner');
    expect(mockPrismaFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'sub-1',
          formInstance: {
            ownerId: 'different-owner',
          },
        },
      })
    );
  });
});