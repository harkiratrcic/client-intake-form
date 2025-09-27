import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { AuditService } from '../audit-service';

describe('AuditService', () => {
  let prisma: PrismaClient;
  let auditService: AuditService;

  beforeEach(async () => {
    prisma = new PrismaClient();
    auditService = new AuditService(prisma);
  });

  afterEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.$disconnect();
  });

  describe('log', () => {
    it('should create audit log entry', async () => {
      const logData = {
        entityType: 'FormInstance',
        entityId: 'test-entity-id',
        action: 'created',
        actorType: 'OWNER' as const,
        actorId: 'owner-123',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Test Browser',
        metadata: { templateId: 'template-123', clientEmail: 'client@example.com' },
      };

      await auditService.log(logData);

      const logs = await prisma.auditLog.findMany();
      expect(logs.length).toBe(1);

      const log = logs[0];
      expect(log.entityType).toBe(logData.entityType);
      expect(log.entityId).toBe(logData.entityId);
      expect(log.action).toBe(logData.action);
      expect(log.actorType).toBe(logData.actorType);
      expect(log.actorId).toBe(logData.actorId);
      expect(log.ipAddress).toBe(logData.ipAddress);
      expect(log.userAgent).toBe(logData.userAgent);
      expect(log.metadata).toEqual(logData.metadata);
      expect(log.createdAt).toBeDefined();
    });

    it('should handle minimal log data', async () => {
      const logData = {
        entityType: 'FormInstance',
        entityId: 'test-entity-id',
        action: 'viewed',
        actorType: 'CLIENT' as const,
      };

      await auditService.log(logData);

      const logs = await prisma.auditLog.findMany();
      expect(logs.length).toBe(1);

      const log = logs[0];
      expect(log.entityType).toBe(logData.entityType);
      expect(log.actorId).toBeNull();
      expect(log.ipAddress).toBeNull();
      expect(log.userAgent).toBeNull();
      expect(log.metadata).toBeNull();
    });

    it('should handle JSON metadata correctly', async () => {
      const complexMetadata = {
        formFields: ['email', 'name', 'phone'],
        validationErrors: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'phone', message: 'Phone number required' },
        ],
        attemptCount: 3,
        nested: {
          deep: {
            value: 'test'
          }
        }
      };

      const logData = {
        entityType: 'FormResponse',
        entityId: 'response-123',
        action: 'validation_failed',
        actorType: 'CLIENT' as const,
        metadata: complexMetadata,
      };

      await auditService.log(logData);

      const logs = await prisma.auditLog.findMany();
      expect(logs.length).toBe(1);

      const log = logs[0];
      expect(log.metadata).toEqual(complexMetadata);
    });
  });

  describe('logFormInstanceCreated', () => {
    it('should log form instance creation', async () => {
      const data = {
        formInstanceId: 'instance-123',
        ownerId: 'owner-456',
        templateId: 'template-789',
        clientEmail: 'client@example.com',
        ipAddress: '192.168.1.100',
        userAgent: 'Test Browser',
      };

      await auditService.logFormInstanceCreated(data);

      const logs = await prisma.auditLog.findMany();
      expect(logs.length).toBe(1);

      const log = logs[0];
      expect(log.entityType).toBe('FormInstance');
      expect(log.entityId).toBe(data.formInstanceId);
      expect(log.action).toBe('created');
      expect(log.actorType).toBe('OWNER');
      expect(log.actorId).toBe(data.ownerId);
      expect(log.metadata).toEqual({
        templateId: data.templateId,
        clientEmail: data.clientEmail,
      });
    });
  });

  describe('logFormAccessed', () => {
    it('should log form access', async () => {
      const data = {
        formInstanceId: 'instance-123',
        clientEmail: 'client@example.com',
        ipAddress: '192.168.1.200',
        userAgent: 'Mobile Browser',
      };

      await auditService.logFormAccessed(data);

      const logs = await prisma.auditLog.findMany();
      expect(logs.length).toBe(1);

      const log = logs[0];
      expect(log.entityType).toBe('FormInstance');
      expect(log.entityId).toBe(data.formInstanceId);
      expect(log.action).toBe('accessed');
      expect(log.actorType).toBe('CLIENT');
      expect(log.actorId).toBe(data.clientEmail);
      expect(log.metadata).toEqual({
        firstAccess: true,
      });
    });

    it('should handle repeat access', async () => {
      const data = {
        formInstanceId: 'instance-123',
        clientEmail: 'client@example.com',
        isFirstAccess: false,
      };

      await auditService.logFormAccessed(data);

      const logs = await prisma.auditLog.findMany();
      const log = logs[0];
      expect(log.metadata).toEqual({
        firstAccess: false,
      });
    });
  });

  describe('logFormSubmitted', () => {
    it('should log form submission', async () => {
      const data = {
        formInstanceId: 'instance-123',
        clientEmail: 'client@example.com',
        ipAddress: '192.168.1.300',
        userAgent: 'Desktop Browser',
        fieldCount: 15,
      };

      await auditService.logFormSubmitted(data);

      const logs = await prisma.auditLog.findMany();
      expect(logs.length).toBe(1);

      const log = logs[0];
      expect(log.entityType).toBe('FormInstance');
      expect(log.action).toBe('submitted');
      expect(log.actorType).toBe('CLIENT');
      expect(log.metadata).toEqual({
        fieldCount: data.fieldCount,
      });
    });
  });

  describe('getLogsByEntity', () => {
    beforeEach(async () => {
      // Create test logs
      await auditService.log({
        entityType: 'FormInstance',
        entityId: 'instance-123',
        action: 'created',
        actorType: 'OWNER',
      });

      await auditService.log({
        entityType: 'FormInstance',
        entityId: 'instance-123',
        action: 'accessed',
        actorType: 'CLIENT',
      });

      await auditService.log({
        entityType: 'FormInstance',
        entityId: 'instance-456',
        action: 'created',
        actorType: 'OWNER',
      });
    });

    it('should return logs for specific entity', async () => {
      const logs = await auditService.getLogsByEntity('FormInstance', 'instance-123');

      expect(logs.length).toBe(2);
      logs.forEach(log => {
        expect(log.entityType).toBe('FormInstance');
        expect(log.entityId).toBe('instance-123');
      });

      // Should be ordered by creation date (newest first)
      expect(logs[0].createdAt.getTime()).toBeGreaterThanOrEqual(logs[1].createdAt.getTime());
    });

    it('should return empty array for non-existent entity', async () => {
      const logs = await auditService.getLogsByEntity('FormInstance', 'non-existent');
      expect(logs.length).toBe(0);
    });
  });

  describe('getLogsByActor', () => {
    beforeEach(async () => {
      await auditService.log({
        entityType: 'FormInstance',
        entityId: 'instance-1',
        action: 'created',
        actorType: 'OWNER',
        actorId: 'owner-123',
      });

      await auditService.log({
        entityType: 'FormInstance',
        entityId: 'instance-2',
        action: 'created',
        actorType: 'OWNER',
        actorId: 'owner-123',
      });

      await auditService.log({
        entityType: 'FormInstance',
        entityId: 'instance-3',
        action: 'accessed',
        actorType: 'CLIENT',
        actorId: 'client@example.com',
      });
    });

    it('should return logs by actor', async () => {
      const ownerLogs = await auditService.getLogsByActor('owner-123');
      expect(ownerLogs.length).toBe(2);
      ownerLogs.forEach(log => {
        expect(log.actorId).toBe('owner-123');
        expect(log.actorType).toBe('OWNER');
      });

      const clientLogs = await auditService.getLogsByActor('client@example.com');
      expect(clientLogs.length).toBe(1);
      expect(clientLogs[0].actorType).toBe('CLIENT');
    });
  });

  describe('cleanupOldLogs', () => {
    it('should remove logs older than specified days', async () => {
      // Create old log
      const oldLog = await prisma.auditLog.create({
        data: {
          entityType: 'FormInstance',
          entityId: 'old-instance',
          action: 'created',
          actorType: 'OWNER',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        },
      });

      // Create recent log
      await auditService.log({
        entityType: 'FormInstance',
        entityId: 'recent-instance',
        action: 'created',
        actorType: 'OWNER',
      });

      // Clean up logs older than 7 days
      const deletedCount = await auditService.cleanupOldLogs(7);

      expect(deletedCount).toBe(1);

      const remainingLogs = await prisma.auditLog.findMany();
      expect(remainingLogs.length).toBe(1);
      expect(remainingLogs[0].entityId).toBe('recent-instance');
    });

    it('should return 0 when no old logs exist', async () => {
      await auditService.log({
        entityType: 'FormInstance',
        entityId: 'recent-instance',
        action: 'created',
        actorType: 'OWNER',
      });

      const deletedCount = await auditService.cleanupOldLogs(7);
      expect(deletedCount).toBe(0);
    });
  });
});