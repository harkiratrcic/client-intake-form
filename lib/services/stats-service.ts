import { prisma } from '../prisma';

export interface DashboardStats {
  totalForms: number;
  activeForms: number;
  submittedForms: number;
  expiredForms: number;
}

export interface RecentSubmission {
  id: string;
  submissionId: string;
  submittedAt: Date;
  formInstance: {
    clientEmail: string;
    createdAt: Date;
  };
}

export interface ExpiringForm {
  id: string;
  token: string;
  clientEmail: string;
  createdAt: Date;
  expiresAt: Date;
  daysUntilExpiry: number;
}

export async function getDashboardStats(ownerId: string): Promise<DashboardStats> {
  const [totalForms, activeForms, submittedForms, expiredForms] = await Promise.all([
    // Total forms created
    prisma.formInstance.count({
      where: { ownerId }
    }),

    // Active forms (not submitted, not expired)
    prisma.formInstance.count({
      where: {
        ownerId,
        status: 'SENT',
        expiresAt: {
          gt: new Date()
        }
      }
    }),

    // Submitted forms
    prisma.formInstance.count({
      where: {
        ownerId,
        status: 'COMPLETED'
      }
    }),

    // Expired forms
    prisma.formInstance.count({
      where: {
        ownerId,
        status: 'SENT',
        expiresAt: {
          lt: new Date()
        }
      }
    })
  ]);

  return {
    totalForms,
    activeForms,
    submittedForms,
    expiredForms
  };
}

export async function getRecentSubmissions(ownerId: string, limit: number = 5): Promise<RecentSubmission[]> {
  const submissions = await prisma.formResponse.findMany({
    where: {
      instance: {
        ownerId
      },
      submittedAt: {
        not: null
      }
    },
    include: {
      instance: {
        select: {
          clientEmail: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      submittedAt: 'desc'
    },
    take: limit
  });

  return submissions.map(submission => ({
    id: submission.id,
    submissionId: submission.submissionId!,
    submittedAt: submission.submittedAt!,
    formInstance: {
      clientEmail: submission.instance.clientEmail,
      createdAt: submission.instance.createdAt
    }
  }));
}

export async function getExpiringForms(ownerId: string, daysAhead: number = 7): Promise<ExpiringForm[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

  const forms = await prisma.formInstance.findMany({
    where: {
      ownerId,
      status: 'SENT',
      expiresAt: {
        gt: new Date(), // Not yet expired
        lt: cutoffDate   // Expires within daysAhead days
      }
    },
    orderBy: {
      expiresAt: 'asc'
    }
  });

  const now = new Date();
  return forms.map(form => {
    const daysUntilExpiry = Math.ceil(
      (form.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: form.id,
      token: form.secureToken,
      clientEmail: form.clientEmail,
      createdAt: form.createdAt,
      expiresAt: form.expiresAt,
      daysUntilExpiry
    };
  });
}