import { prisma } from '../prisma';

export interface FormInstance {
  id: string;
  token: string;
  clientEmail: string;
  clientName: string;
  status: 'SENT' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  isExpired: boolean;
  submissionId?: string;
  submittedAt?: Date;
}

export interface FormsQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  sortBy?: 'createdAt' | 'updatedAt' | 'clientEmail' | 'status' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
}

export interface FormsQueryResult {
  forms: FormInstance[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getFormsForOwner(
  ownerId: string,
  options: FormsQueryOptions = {}
): Promise<FormsQueryResult> {
  const {
    page = 1,
    limit = 10,
    search = '',
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const skip = (page - 1) * limit;
  const now = new Date();

  // Build where clause
  const where: any = {
    ownerId,
  };

  // Add search filter
  if (search) {
    where.OR = [
      {
        clientEmail: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        clientName: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  // Add status filter
  if (status) {
    if (status === 'EXPIRED') {
      where.status = 'SENT';
      where.expiresAt = {
        lt: now,
      };
    } else {
      where.status = status;
      if (status === 'SENT') {
        // For SENT status, exclude expired forms
        where.expiresAt = {
          gt: now,
        };
      }
    }
  }

  // Get total count
  const total = await prisma.formInstance.count({ where });

  // Get forms with pagination
  const forms = await prisma.formInstance.findMany({
    where,
    include: {
      response: {
        select: {
          submissionId: true,
          submittedAt: true,
        },
      },
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip,
    take: limit,
  });

  // Transform and add computed fields
  const transformedForms: FormInstance[] = forms.map(form => {
    const isExpired = form.status === 'SENT' && form.expiresAt < now;
    return {
      id: form.id,
      token: form.secureToken,
      clientEmail: form.clientEmail,
      clientName: form.clientEmail.split('@')[0], // Generate name from email prefix
      status: form.status,
      createdAt: form.createdAt,
      updatedAt: form.createdAt, // Use createdAt as updatedAt since updatedAt doesn't exist in schema
      expiresAt: form.expiresAt,
      isExpired,
      submissionId: form.response?.submissionId,
      submittedAt: form.response?.submittedAt,
    };
  });

  const totalPages = Math.ceil(total / limit);

  return {
    forms: transformedForms,
    total,
    page,
    limit,
    totalPages,
  };
}

export async function getFormByToken(token: string, ownerId: string): Promise<FormInstance | null> {
  const form = await prisma.formInstance.findFirst({
    where: {
      secureToken: token,
      ownerId,
    },
    include: {
      response: {
        select: {
          submissionId: true,
          submittedAt: true,
        },
      },
    },
  });

  if (!form) {
    return null;
  }

  const now = new Date();
  const isExpired = form.status === 'SENT' && form.expiresAt < now;

  return {
    id: form.id,
    token: form.secureToken,
    clientEmail: form.clientEmail,
    clientName: form.clientEmail.split('@')[0], // Generate name from email prefix
    status: form.status,
    createdAt: form.createdAt,
    updatedAt: form.createdAt, // Use createdAt as updatedAt since updatedAt doesn't exist in schema
    expiresAt: form.expiresAt,
    isExpired,
    submissionId: form.response?.submissionId,
    submittedAt: form.response?.submittedAt,
  };
}

export function getStatusBadgeColor(status: string, isExpired: boolean): string {
  if (isExpired && status === 'SENT') {
    return 'bg-red-100 text-red-800';
  }

  switch (status) {
    case 'SENT':
      return 'bg-blue-100 text-blue-800';
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusDisplayName(status: string, isExpired: boolean): string {
  if (isExpired && status === 'SENT') {
    return 'Expired';
  }

  switch (status) {
    case 'SENT':
      return 'Sent';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'COMPLETED':
      return 'Completed';
    default:
      return status;
  }
}