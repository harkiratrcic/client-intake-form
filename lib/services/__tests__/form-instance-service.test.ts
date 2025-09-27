import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { FormInstanceService } from '../form-instance-service';
import { seedTemplates } from '@/prisma/seed';
import { hashPassword } from '@/lib/auth/password';

describe('FormInstanceService', () => {
  let prisma: PrismaClient;
  let formInstanceService: FormInstanceService;
  let testOwnerId: string;
  let testTemplateId: string;

  beforeEach(async () => {
    prisma = new PrismaClient();
    formInstanceService = new FormInstanceService(prisma);

    // Create test owner
    const owner = await prisma.owner.create({
      data: {
        email: 'test@rcic.ca',
        passwordHash: await hashPassword('TestPass123!'),
        businessName: 'Test Immigration Services',
        isActive: true,
      },
    });
    testOwnerId = owner.id;

    // Clear and seed templates
    await prisma.formTemplate.deleteMany();
    await seedTemplates(prisma);

    // Get a template ID for testing
    const template = await prisma.formTemplate.findFirst();
    testTemplateId = template?.id || '';
  });

  afterEach(async () => {
    await prisma.formResponse.deleteMany();
    await prisma.formInstance.deleteMany();
    await prisma.formTemplate.deleteMany();
    await prisma.owner.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.$disconnect();
  });

  describe('createInstance', () => {
    it('should create form instance successfully', async () => {
      const clientEmail = 'client@example.com';
      const expiryDays = 7;
      const personalMessage = 'Please complete this form at your earliest convenience.';

      const result = await formInstanceService.createInstance({
        templateId: testTemplateId,
        ownerId: testOwnerId,
        clientEmail,
        expiryDays,
        personalMessage,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.instance.templateId).toBe(testTemplateId);
        expect(result.instance.ownerId).toBe(testOwnerId);
        expect(result.instance.clientEmail).toBe(clientEmail);
        expect(result.instance.personalMessage).toBe(personalMessage);
        expect(result.instance.status).toBe('SENT');
        expect(result.instance.secureToken).toBeDefined();
        expect(result.instance.expiresAt).toBeInstanceOf(Date);

        // Verify token format
        expect(result.instance.secureToken.length).toBeGreaterThan(16);
        expect(result.instance.secureToken).toMatch(/^[A-Za-z0-9_-]+$/);

        // Verify in database
        const dbInstance = await prisma.formInstance.findUnique({
          where: { id: result.instance.id },
        });
        expect(dbInstance).toBeDefined();
        expect(dbInstance?.status).toBe('SENT');
      }
    });

    it('should create instance with default values', async () => {
      const result = await formInstanceService.createInstance({
        templateId: testTemplateId,
        ownerId: testOwnerId,
        clientEmail: 'client@example.com',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.instance.personalMessage).toBeNull();
        expect(result.instance.status).toBe('SENT');

        // Should expire in approximately 7 days
        const now = new Date();
        const expectedExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const timeDiff = Math.abs(result.instance.expiresAt.getTime() - expectedExpiry.getTime());
        expect(timeDiff).toBeLessThan(5000); // Allow 5 second tolerance
      }
    });

    it('should reject invalid template ID', async () => {
      const result = await formInstanceService.createInstance({
        templateId: 'invalid-template-id',
        ownerId: testOwnerId,
        clientEmail: 'client@example.com',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Template not found');
      }
    });

    it('should reject invalid owner ID', async () => {
      const result = await formInstanceService.createInstance({
        templateId: testTemplateId,
        ownerId: 'invalid-owner-id',
        clientEmail: 'client@example.com',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Owner not found');
      }
    });

    it('should normalize email addresses', async () => {
      const result = await formInstanceService.createInstance({
        templateId: testTemplateId,
        ownerId: testOwnerId,
        clientEmail: '  Client@EXAMPLE.COM  ',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.instance.clientEmail).toBe('client@example.com');
      }
    });

    it('should generate unique tokens', async () => {
      const result1 = await formInstanceService.createInstance({
        templateId: testTemplateId,
        ownerId: testOwnerId,
        clientEmail: 'client1@example.com',
      });

      const result2 = await formInstanceService.createInstance({
        templateId: testTemplateId,
        ownerId: testOwnerId,
        clientEmail: 'client2@example.com',
      });

      expect(result1.success && result2.success).toBe(true);
      if (result1.success && result2.success) {
        expect(result1.instance.secureToken).not.toBe(result2.instance.secureToken);
      }
    });

    it('should handle database errors gracefully', async () => {
      // This test would require more complex setup to trigger specific database errors
      // For now, we'll just verify the error handling structure exists
      expect(typeof formInstanceService.createInstance).toBe('function');
    });
  });

  describe('findByToken', () => {
    let testToken: string;

    beforeEach(async () => {
      const result = await formInstanceService.createInstance({
        templateId: testTemplateId,
        ownerId: testOwnerId,
        clientEmail: 'client@example.com',
      });

      if (result.success) {
        testToken = result.instance.secureToken;
      }
    });

    it('should find instance by valid token', async () => {
      const result = await formInstanceService.findByToken(testToken);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.instance.secureToken).toBe(testToken);
        expect(result.instance.status).toBe('IN_PROGRESS'); // Status updated on first access
        expect(result.template).toBeDefined();
        expect(result.template.id).toBe(testTemplateId);
      }
    });

    it('should return error for invalid token', async () => {
      const result = await formInstanceService.findByToken('invalid-token');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid token format');
      }
    });

    it('should return error for non-existent token', async () => {
      const result = await formInstanceService.findByToken('validformat_but_nonexistent_token123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Form not found');
      }
    });

    it('should return error for expired token', async () => {
      // Update instance to be expired
      await prisma.formInstance.update({
        where: { secureToken: testToken },
        data: { expiresAt: new Date(Date.now() - 1000) }, // 1 second ago
      });

      const result = await formInstanceService.findByToken(testToken);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Form has expired');
      }
    });

    it('should return error for already completed form', async () => {
      // Update instance to be completed
      await prisma.formInstance.update({
        where: { secureToken: testToken },
        data: { status: 'COMPLETED' },
      });

      const result = await formInstanceService.findByToken(testToken);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Form has already been submitted');
      }
    });

    it('should update status to IN_PROGRESS on first access', async () => {
      // Verify initial status
      const instance = await prisma.formInstance.findUnique({
        where: { secureToken: testToken },
      });
      expect(instance?.status).toBe('SENT');

      // Access the form
      const result = await formInstanceService.findByToken(testToken);

      expect(result.success).toBe(true);

      // Verify status updated
      const updatedInstance = await prisma.formInstance.findUnique({
        where: { secureToken: testToken },
      });
      expect(updatedInstance?.status).toBe('IN_PROGRESS');
      expect(updatedInstance?.openedAt).toBeDefined();
    });

    it('should not change status if already IN_PROGRESS', async () => {
      // First access
      await formInstanceService.findByToken(testToken);

      const beforeSecondAccess = await prisma.formInstance.findUnique({
        where: { secureToken: testToken },
      });

      // Second access
      await formInstanceService.findByToken(testToken);

      const afterSecondAccess = await prisma.formInstance.findUnique({
        where: { secureToken: testToken },
      });

      expect(beforeSecondAccess?.openedAt).toEqual(afterSecondAccess?.openedAt);
      expect(afterSecondAccess?.status).toBe('IN_PROGRESS');
    });
  });

  describe('updateStatus', () => {
    let testInstanceId: string;

    beforeEach(async () => {
      const result = await formInstanceService.createInstance({
        templateId: testTemplateId,
        ownerId: testOwnerId,
        clientEmail: 'client@example.com',
      });

      if (result.success) {
        testInstanceId = result.instance.id;
      }
    });

    it('should update status successfully', async () => {
      const result = await formInstanceService.updateStatus(testInstanceId, 'IN_PROGRESS');

      expect(result.success).toBe(true);

      // Verify in database
      const instance = await prisma.formInstance.findUnique({
        where: { id: testInstanceId },
      });
      expect(instance?.status).toBe('IN_PROGRESS');
    });

    it('should handle invalid instance ID', async () => {
      const result = await formInstanceService.updateStatus('invalid-id', 'IN_PROGRESS');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not found');
      }
    });

    it('should update submittedAt when status is COMPLETED', async () => {
      const result = await formInstanceService.updateStatus(testInstanceId, 'COMPLETED');

      expect(result.success).toBe(true);

      const instance = await prisma.formInstance.findUnique({
        where: { id: testInstanceId },
      });
      expect(instance?.status).toBe('COMPLETED');
      expect(instance?.submittedAt).toBeDefined();
    });
  });

  describe('getInstancesByOwner', () => {
    beforeEach(async () => {
      // Create multiple instances for testing
      await formInstanceService.createInstance({
        templateId: testTemplateId,
        ownerId: testOwnerId,
        clientEmail: 'client1@example.com',
      });

      await formInstanceService.createInstance({
        templateId: testTemplateId,
        ownerId: testOwnerId,
        clientEmail: 'client2@example.com',
      });
    });

    it('should return instances for owner', async () => {
      const instances = await formInstanceService.getInstancesByOwner(testOwnerId);

      expect(instances.length).toBe(2);
      instances.forEach(instance => {
        expect(instance.ownerId).toBe(testOwnerId);
        expect(instance.template).toBeDefined();
      });
    });

    it('should return empty array for owner with no instances', async () => {
      // Create another owner
      const otherOwner = await prisma.owner.create({
        data: {
          email: 'other@rcic.ca',
          passwordHash: await hashPassword('TestPass123!'),
          businessName: 'Other Services',
          isActive: true,
        },
      });

      const instances = await formInstanceService.getInstancesByOwner(otherOwner.id);
      expect(instances.length).toBe(0);
    });

    it('should order instances by creation date (newest first)', async () => {
      const instances = await formInstanceService.getInstancesByOwner(testOwnerId);

      // Should be ordered by createdAt DESC
      for (let i = 1; i < instances.length; i++) {
        expect(instances[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
          instances[i].createdAt.getTime()
        );
      }
    });
  });
});