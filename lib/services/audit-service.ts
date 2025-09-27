import { PrismaClient, ActorType } from '@prisma/client';

export interface AuditLogData {
  entityType: string;
  entityId: string;
  action: string;
  actorType: ActorType;
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export interface FormInstanceCreatedData {
  formInstanceId: string;
  ownerId: string;
  templateId: string;
  clientEmail: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface FormAccessedData {
  formInstanceId: string;
  clientEmail: string;
  ipAddress?: string;
  userAgent?: string;
  isFirstAccess?: boolean;
}

export interface FormSubmittedData {
  formInstanceId: string;
  clientEmail: string;
  ipAddress?: string;
  userAgent?: string;
  fieldCount?: number;
}

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generic audit logging method
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: data.entityType,
          entityId: data.entityId,
          action: data.action,
          actorType: data.actorType,
          actorId: data.actorId || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          metadata: data.metadata || null,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging shouldn't break the main functionality
    }
  }

  /**
   * Log form instance creation
   */
  async logFormInstanceCreated(data: FormInstanceCreatedData): Promise<void> {
    await this.log({
      entityType: 'FormInstance',
      entityId: data.formInstanceId,
      action: 'created',
      actorType: 'OWNER',
      actorId: data.ownerId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: {
        templateId: data.templateId,
        clientEmail: data.clientEmail,
      },
    });
  }

  /**
   * Log form access by client
   */
  async logFormAccessed(data: FormAccessedData): Promise<void> {
    await this.log({
      entityType: 'FormInstance',
      entityId: data.formInstanceId,
      action: 'accessed',
      actorType: 'CLIENT',
      actorId: data.clientEmail,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: {
        firstAccess: data.isFirstAccess !== false, // Default to true
      },
    });
  }

  /**
   * Log form submission
   */
  async logFormSubmitted(data: FormSubmittedData): Promise<void> {
    await this.log({
      entityType: 'FormInstance',
      entityId: data.formInstanceId,
      action: 'submitted',
      actorType: 'CLIENT',
      actorId: data.clientEmail,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: {
        fieldCount: data.fieldCount,
      },
    });
  }

  /**
   * Log form data auto-save
   */
  async logFormAutoSaved(data: {
    formInstanceId: string;
    clientEmail: string;
    ipAddress?: string;
    fieldCount?: number;
  }): Promise<void> {
    await this.log({
      entityType: 'FormResponse',
      entityId: data.formInstanceId,
      action: 'auto_saved',
      actorType: 'CLIENT',
      actorId: data.clientEmail,
      ipAddress: data.ipAddress,
      metadata: {
        fieldCount: data.fieldCount,
      },
    });
  }

  /**
   * Log data export by owner
   */
  async logDataExported(data: {
    ownerId: string;
    exportType: string;
    recordCount: number;
    filters?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.log({
      entityType: 'DataExport',
      entityId: `export_${Date.now()}`,
      action: 'exported',
      actorType: 'OWNER',
      actorId: data.ownerId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: {
        exportType: data.exportType,
        recordCount: data.recordCount,
        filters: data.filters,
      },
    });
  }

  /**
   * Get audit logs for a specific entity
   */
  async getLogsByEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get audit logs by actor (owner or client)
   */
  async getLogsByActor(actorId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        actorId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get audit logs within date range
   */
  async getLogsByDateRange(startDate: Date, endDate: Date) {
    return this.prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get audit logs for compliance reporting
   */
  async getComplianceLogs(options: {
    entityType?: string;
    actorType?: ActorType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}) {
    const where: any = {};

    if (options.entityType) {
      where.entityType = options.entityType;
    }

    if (options.actorType) {
      where.actorType = options.actorType;
    }

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: options.limit,
    });
  }

  /**
   * Clean up old audit logs (for data retention)
   */
  async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    try {
      const result = await this.prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('Failed to cleanup old audit logs:', error);
      return 0;
    }
  }

  /**
   * Get audit log statistics
   */
  async getLogStats(days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [total, byActorType, byAction] = await Promise.all([
      this.prisma.auditLog.count({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      }),

      this.prisma.auditLog.groupBy({
        by: ['actorType'],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          actorType: true,
        },
      }),

      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          action: true,
        },
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      total,
      byActorType: byActorType.reduce((acc, item) => {
        acc[item.actorType] = item._count.actorType;
        return acc;
      }, {} as Record<string, number>),
      topActions: byAction.map(item => ({
        action: item.action,
        count: item._count.action,
      })),
    };
  }
}