import { PrismaClient, FormInstance, FormTemplate, FormStatus } from '@prisma/client';
import { TokenService } from './token-service';
import { AuditService } from './audit-service';

export interface CreateInstanceData {
  templateId: string;
  ownerId: string;
  clientEmail: string;
  expiryDays?: number;
  personalMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

export type CreateInstanceResult = {
  success: true;
  instance: FormInstance;
} | {
  success: false;
  error: string;
}

export type FindByTokenResult = {
  success: true;
  instance: FormInstance;
  template: FormTemplate;
} | {
  success: false;
  error: string;
}

export type UpdateStatusResult = {
  success: boolean;
  error?: string;
}

export type FormInstanceWithTemplate = FormInstance & {
  template: FormTemplate;
};

export class FormInstanceService {
  private tokenService: TokenService;
  private auditService: AuditService;

  constructor(private prisma: PrismaClient) {
    this.tokenService = new TokenService();
    this.auditService = new AuditService(prisma);
  }

  /**
   * Create a new form instance
   */
  async createInstance(data: CreateInstanceData): Promise<CreateInstanceResult> {
    try {
      // Validate template exists and is active
      const template = await this.prisma.formTemplate.findFirst({
        where: {
          id: data.templateId,
          isActive: true,
        },
      });

      if (!template) {
        return { success: false, error: 'Template not found or inactive' };
      }

      // Validate owner exists and is active
      const owner = await this.prisma.owner.findFirst({
        where: {
          id: data.ownerId,
          isActive: true,
        },
      });

      if (!owner) {
        return { success: false, error: 'Owner not found or inactive' };
      }

      // Generate secure token and expiry
      const { token, expiresAt } = this.tokenService.generateTokenWithExpiry(data.expiryDays);

      // Normalize client email
      const clientEmail = data.clientEmail.trim().toLowerCase();

      // Create form instance
      const instance = await this.prisma.formInstance.create({
        data: {
          templateId: data.templateId,
          ownerId: data.ownerId,
          clientEmail,
          secureToken: token,
          personalMessage: data.personalMessage || null,
          expiresAt,
          status: 'SENT',
        },
      });

      // Log the creation
      await this.auditService.logFormInstanceCreated({
        formInstanceId: instance.id,
        ownerId: data.ownerId,
        templateId: data.templateId,
        clientEmail,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });

      return {
        success: true,
        instance,
      };

    } catch (error) {
      console.error('Error creating form instance:', error);
      return {
        success: false,
        error: 'Failed to create form instance',
      };
    }
  }

  /**
   * Find form instance by secure token
   */
  async findByToken(token: string): Promise<FindByTokenResult> {
    try {
      // Validate token format first
      if (!this.tokenService.validateTokenFormat(token)) {
        return { success: false, error: 'Invalid token format' };
      }

      // Find instance with template
      const instance = await this.prisma.formInstance.findUnique({
        where: { secureToken: token },
        include: { template: true },
      });

      if (!instance) {
        return { success: false, error: 'Form not found' };
      }

      // Check if expired
      if (this.tokenService.isExpired(instance.expiresAt)) {
        return { success: false, error: 'Form has expired' };
      }

      // Check if already completed
      if (instance.status === 'COMPLETED') {
        return { success: false, error: 'Form has already been submitted' };
      }

      // Check if template is still active
      if (!instance.template.isActive) {
        return { success: false, error: 'Form template is no longer available' };
      }

      // Update status to IN_PROGRESS if this is first access
      let updatedInstance = instance;
      if (instance.status === 'SENT') {
        updatedInstance = await this.prisma.formInstance.update({
          where: { id: instance.id },
          data: {
            status: 'IN_PROGRESS',
            openedAt: new Date(),
          },
          include: { template: true },
        });

        // Log first access
        await this.auditService.logFormAccessed({
          formInstanceId: instance.id,
          clientEmail: instance.clientEmail,
          isFirstAccess: true,
        });
      }

      return {
        success: true,
        instance: updatedInstance,
        template: updatedInstance.template,
      };

    } catch (error) {
      console.error('Error finding form instance:', error);
      return { success: false, error: 'Failed to retrieve form' };
    }
  }

  /**
   * Update form instance status
   */
  async updateStatus(instanceId: string, status: FormStatus): Promise<UpdateStatusResult> {
    try {
      const updateData: any = { status };

      // Set submittedAt when completing
      if (status === 'COMPLETED') {
        updateData.submittedAt = new Date();
      }

      const instance = await this.prisma.formInstance.update({
        where: { id: instanceId },
        data: updateData,
      });

      return { success: true };

    } catch (error) {
      console.error('Error updating form instance status:', error);

      // Check if instance exists
      const exists = await this.prisma.formInstance.findUnique({
        where: { id: instanceId },
      });

      if (!exists) {
        return { success: false, error: 'Form instance not found' };
      }

      return { success: false, error: 'Failed to update form status' };
    }
  }

  /**
   * Get all instances for an owner
   */
  async getInstancesByOwner(
    ownerId: string,
    options: {
      status?: FormStatus;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<FormInstanceWithTemplate[]> {
    const where: any = { ownerId };

    if (options.status) {
      where.status = options.status;
    }

    return this.prisma.formInstance.findMany({
      where,
      include: {
        template: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: options.limit,
      skip: options.offset,
    });
  }

  /**
   * Get form instance by ID (for owner access)
   */
  async getInstanceById(instanceId: string, ownerId: string): Promise<FormInstanceWithTemplate | null> {
    return this.prisma.formInstance.findFirst({
      where: {
        id: instanceId,
        ownerId,
      },
      include: {
        template: true,
        response: true,
      },
    });
  }

  /**
   * Check if form instance exists and belongs to owner
   */
  async instanceBelongsToOwner(instanceId: string, ownerId: string): Promise<boolean> {
    const instance = await this.prisma.formInstance.findFirst({
      where: {
        id: instanceId,
        ownerId,
      },
    });

    return instance !== null;
  }

  /**
   * Get instance statistics for owner
   */
  async getOwnerStats(ownerId: string, days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [total, recent, byStatus] = await Promise.all([
      // Total instances
      this.prisma.formInstance.count({
        where: { ownerId },
      }),

      // Recent instances
      this.prisma.formInstance.count({
        where: {
          ownerId,
          createdAt: {
            gte: startDate,
          },
        },
      }),

      // By status
      this.prisma.formInstance.groupBy({
        by: ['status'],
        where: { ownerId },
        _count: {
          status: true,
        },
      }),
    ]);

    const statusCounts = byStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      recent,
      byStatus: statusCounts,
    };
  }

  /**
   * Clean up expired instances (for maintenance)
   */
  async cleanupExpiredInstances(): Promise<number> {
    try {
      // Update expired instances to EXPIRED status
      const result = await this.prisma.formInstance.updateMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
          status: {
            in: ['SENT', 'IN_PROGRESS'],
          },
        },
        data: {
          status: 'EXPIRED',
        },
      });

      return result.count;
    } catch (error) {
      console.error('Error cleaning up expired instances:', error);
      return 0;
    }
  }

  /**
   * Resend form (create new instance with same data)
   */
  async resendForm(originalInstanceId: string, ownerId: string, expiryDays?: number): Promise<CreateInstanceResult> {
    try {
      // Get original instance
      const originalInstance = await this.prisma.formInstance.findFirst({
        where: {
          id: originalInstanceId,
          ownerId,
        },
      });

      if (!originalInstance) {
        return { success: false, error: 'Original form instance not found' };
      }

      // Create new instance with same data
      return this.createInstance({
        templateId: originalInstance.templateId,
        ownerId: originalInstance.ownerId,
        clientEmail: originalInstance.clientEmail,
        expiryDays,
        personalMessage: originalInstance.personalMessage || undefined,
      });

    } catch (error) {
      console.error('Error resending form:', error);
      return { success: false, error: 'Failed to resend form' };
    }
  }
}