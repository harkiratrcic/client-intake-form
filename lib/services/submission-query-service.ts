import { prisma } from '../prisma';

export interface SubmissionQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'submittedAt' | 'clientEmail' | 'formTitle';
  sortOrder?: 'asc' | 'desc';
}

export interface SubmissionListItem {
  id: string;
  formInstanceId: string;
  clientEmail: string;
  clientName: string;
  formTitle: string;
  templateCategory: string;
  submittedAt: Date;
  data: any;
}

export interface SubmissionsQueryResult {
  submissions: SubmissionListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getSubmissionsForOwner(
  ownerId: string,
  options: SubmissionQueryOptions = {}
): Promise<SubmissionsQueryResult> {
  const {
    page = 1,
    limit = 10,
    search = '',
    startDate,
    endDate,
    sortBy = 'submittedAt',
    sortOrder = 'desc',
  } = options;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    formInstance: {
      ownerId,
      status: 'COMPLETED',
    },
  };

  // Add search filters
  if (search) {
    where.OR = [
      {
        formInstance: {
          clientEmail: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
      {
        formInstance: {
          clientName: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
    ];
  }

  // Add date filters
  if (startDate || endDate) {
    where.submittedAt = {};
    if (startDate) {
      where.submittedAt.gte = startDate;
    }
    if (endDate) {
      where.submittedAt.lte = endDate;
    }
  }

  // Build orderBy
  let orderBy: any = {};
  switch (sortBy) {
    case 'clientEmail':
      orderBy = {
        formInstance: {
          clientEmail: sortOrder,
        },
      };
      break;
    case 'formTitle':
      orderBy = {
        formInstance: {
          template: {
            name: sortOrder,
          },
        },
      };
      break;
    case 'submittedAt':
    default:
      orderBy = {
        submittedAt: sortOrder,
      };
      break;
  }

  // Debug: Check if prisma is defined
  console.log('🔍 Prisma instance:', !!prisma);
  console.log('🔍 Prisma submission:', !!prisma?.submission);

  // Execute queries
  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        formInstance: {
          include: {
            template: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
      },
    }),
    prisma.submission.count({ where }),
  ]);

  // Transform results
  const transformedSubmissions: SubmissionListItem[] = submissions.map((submission) => ({
    id: submission.id,
    formInstanceId: submission.formInstanceId,
    clientEmail: submission.formInstance.clientEmail,
    clientName: submission.formInstance.clientName,
    formTitle: submission.formInstance.template.name,
    templateCategory: submission.formInstance.template.category || 'General',
    submittedAt: submission.submittedAt,
    data: submission.data,
  }));

  return {
    submissions: transformedSubmissions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getSubmissionById(
  id: string,
  ownerId: string
): Promise<SubmissionListItem | null> {
  const submission = await prisma.submission.findFirst({
    where: {
      id,
      formInstance: {
        ownerId,
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

  if (!submission) {
    return null;
  }

  return {
    id: submission.id,
    formInstanceId: submission.formInstanceId,
    clientEmail: submission.formInstance.clientEmail,
    clientName: submission.formInstance.clientName,
    formTitle: submission.formInstance.template.name,
    templateCategory: submission.formInstance.template.category || 'General',
    submittedAt: submission.submittedAt,
    data: submission.data,
  };
}

// Helper function to format submission status
export function getSubmissionStatusBadge(submission: SubmissionListItem): {
  color: string;
  text: string;
} {
  const daysSinceSubmission = Math.floor(
    (Date.now() - new Date(submission.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceSubmission === 0) {
    return {
      color: 'bg-green-100 text-green-800',
      text: 'New',
    };
  } else if (daysSinceSubmission <= 7) {
    return {
      color: 'bg-blue-100 text-blue-800',
      text: 'Recent',
    };
  } else {
    return {
      color: 'bg-gray-100 text-gray-800',
      text: 'Processed',
    };
  }
}