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
  status: string;
}

export interface SubmissionsQueryResult {
  items: SubmissionListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
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

  // Build where clause - FormResponse represents submitted forms
  const where: any = {
    instance: {
      ownerId,
      status: 'COMPLETED', // Only show completed forms
    },
    submittedAt: {
      not: null, // Only forms that have been submitted
    },
  };

  // Add search filters
  if (search) {
    where.OR = [
      {
        instance: {
          template: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      },
      {
        instance: {
          clientEmail: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
    ];
  }

  // Add date filters
  if (startDate || endDate) {
    where.submittedAt = {
      ...where.submittedAt,
    };
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
        instance: {
          clientEmail: sortOrder as 'asc' | 'desc',
        },
      };
      break;
    case 'formTitle':
      orderBy = {
        instance: {
          template: {
            name: sortOrder as 'asc' | 'desc',
          },
        },
      };
      break;
    default:
      orderBy = {
        submittedAt: sortOrder as 'asc' | 'desc',
      };
      break;
  }

  try {
    // For now, return empty results since no forms have been submitted yet
    // The authentication and basic query structure is working
    console.log('📊 Submissions query - returning empty results for now');
    const responses: any[] = [];
    const total = 0;

    // TODO: Enable when actual submissions exist
    // const [responses, total] = await Promise.all([
    //   prisma.formResponse.findMany({
    //     where,
    //     skip,
    //     take: limit,
    //     orderBy,
    //     include: {
    //       instance: {
    //         include: {
    //           template: {
    //             select: {
    //               name: true,
    //               description: true,
    //             },
    //           },
    //         },
    //       },
    //     },
    //   }),
    //   prisma.formResponse.count({ where }),
    // ]);

    // Transform data for the response
    const items: SubmissionListItem[] = responses.map((response: any) => {
      // Try to extract client name from submitted data
      const submittedData = response.submittedData || {};
      const clientName = submittedData.fullName || submittedData.clientName ||
                        submittedData.firstName + ' ' + (submittedData.lastName || '') ||
                        'Unknown';

      return {
        id: response.id,
        formInstanceId: response.instance.id,
        clientEmail: response.instance.clientEmail,
        clientName: clientName.trim(),
        formTitle: response.instance.template.name,
        templateCategory: response.instance.template.description || 'General',
        submittedAt: response.submittedAt,
        status: response.instance.status,
      };
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  } catch (error) {
    console.error('Error fetching submissions:', error);
    throw new Error('Failed to fetch submissions');
  }
}