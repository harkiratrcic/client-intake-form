import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { EmailQueue } from '../email-queue';
import { EmailService } from '../email-service';
import { AuditService } from '../audit-service';

// Mock dependencies
jest.mock('../email-service');
jest.mock('../audit-service');

const MockedEmailService = EmailService as jest.MockedClass<typeof EmailService>;
const MockedAuditService = AuditService as jest.MockedClass<typeof AuditService>;

describe('EmailQueue', () => {
  let emailQueue: EmailQueue;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockAuditService: jest.Mocked<AuditService>;
  let prisma: PrismaClient;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock instances
    mockEmailService = {
      sendFormLink: jest.fn(),
      sendFormConfirmation: jest.fn(),
      validateEmailAddress: jest.fn(),
    } as any;

    mockAuditService = {
      log: jest.fn(),
      logDataExported: jest.fn(),
    } as any;

    MockedEmailService.mockImplementation(() => mockEmailService);
    MockedAuditService.mockImplementation(() => mockAuditService);

    prisma = new PrismaClient();
    emailQueue = new EmailQueue(prisma);
  });

  describe('queueFormLinkEmail', () => {
    const formLinkData = {
      instanceId: 'instance-123',
      to: 'client@example.com',
      formUrl: 'https://example.com/forms/token123',
      personalMessage: 'Please complete this form.',
      ownerName: 'Test Services',
      templateName: 'Test Form',
      expiresAt: new Date(),
      ownerId: 'owner-123',
      ipAddress: '192.168.1.100',
      userAgent: 'Test Browser',
    };

    it('should queue and send form link email successfully', async () => {
      mockEmailService.sendFormLink.mockResolvedValue({
        success: true,
        emailId: 'email-123',
      });

      const result = await emailQueue.queueFormLinkEmail(formLinkData);

      expect(result.success).toBe(true);
      expect(result.emailId).toBe('email-123');

      expect(mockEmailService.sendFormLink).toHaveBeenCalledWith({
        to: formLinkData.to,
        formUrl: formLinkData.formUrl,
        personalMessage: formLinkData.personalMessage,
        ownerName: formLinkData.ownerName,
        templateName: formLinkData.templateName,
        expiresAt: formLinkData.expiresAt,
      });

      // Should log email sent event
      expect(mockAuditService.log).toHaveBeenCalledWith({
        entityType: 'FormInstance',
        entityId: formLinkData.instanceId,
        action: 'email_sent',
        actorType: 'SYSTEM',
        actorId: 'email_service',
        ipAddress: formLinkData.ipAddress,
        userAgent: formLinkData.userAgent,
        metadata: {
          emailType: 'form_link',
          recipientEmail: formLinkData.to,
          emailId: 'email-123',
          success: true,
        },
      });
    });

    it('should handle email send failures', async () => {
      mockEmailService.sendFormLink.mockResolvedValue({
        success: false,
        error: 'Invalid email address',
      });

      const result = await emailQueue.queueFormLinkEmail(formLinkData, { maxRetries: 0 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email address');

      // Should log email failure event
      expect(mockAuditService.log).toHaveBeenCalledWith({
        entityType: 'FormInstance',
        entityId: formLinkData.instanceId,
        action: 'email_failed',
        actorType: 'SYSTEM',
        actorId: 'email_service',
        ipAddress: formLinkData.ipAddress,
        userAgent: formLinkData.userAgent,
        metadata: {
          emailType: 'form_link',
          recipientEmail: formLinkData.to,
          error: 'Invalid email address',
          success: false,
        },
      });
    });

    it('should handle email service exceptions', async () => {
      mockEmailService.sendFormLink.mockRejectedValue(new Error('Network error'));

      const result = await emailQueue.queueFormLinkEmail(formLinkData, { maxRetries: 0 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');

      // Should log exception
      expect(mockAuditService.log).toHaveBeenCalledWith({
        entityType: 'FormInstance',
        entityId: formLinkData.instanceId,
        action: 'email_failed',
        actorType: 'SYSTEM',
        actorId: 'email_service',
        ipAddress: formLinkData.ipAddress,
        userAgent: formLinkData.userAgent,
        metadata: {
          emailType: 'form_link',
          recipientEmail: formLinkData.to,
          error: 'Network error',
          success: false,
        },
      });
    });

    it('should retry failed emails', async () => {
      // First attempt fails
      mockEmailService.sendFormLink
        .mockResolvedValueOnce({
          success: false,
          error: 'Rate limit exceeded',
        })
        // Second attempt succeeds
        .mockResolvedValueOnce({
          success: true,
          emailId: 'email-retry-123',
        });

      const result = await emailQueue.queueFormLinkEmail(formLinkData, { maxRetries: 2 });

      expect(result.success).toBe(true);
      expect(result.emailId).toBe('email-retry-123');

      // Should have been called twice
      expect(mockEmailService.sendFormLink).toHaveBeenCalledTimes(2);

      // Should log both attempts
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'email_failed',
          metadata: expect.objectContaining({
            error: 'Rate limit exceeded',
            success: false,
          }),
        })
      );

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'email_sent',
          metadata: expect.objectContaining({
            emailId: 'email-retry-123',
            success: true,
          }),
        })
      );
    });

    it('should give up after max retries', async () => {
      mockEmailService.sendFormLink.mockResolvedValue({
        success: false,
        error: 'Persistent error',
      });

      const result = await emailQueue.queueFormLinkEmail(formLinkData, { maxRetries: 2 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Persistent error');

      // Should have been called 3 times (initial + 2 retries)
      expect(mockEmailService.sendFormLink).toHaveBeenCalledTimes(3);
    });
  });

  describe('queueFormConfirmationEmail', () => {
    const confirmationData = {
      instanceId: 'instance-123',
      to: 'client@example.com',
      ownerName: 'Test Services',
      templateName: 'Test Form',
      submittedAt: new Date(),
      ownerEmail: 'owner@rcic.ca',
      ownerId: 'owner-123',
      ipAddress: '192.168.1.100',
      userAgent: 'Test Browser',
    };

    it('should queue and send confirmation email successfully', async () => {
      mockEmailService.sendFormConfirmation.mockResolvedValue({
        success: true,
        emailId: 'confirmation-123',
      });

      const result = await emailQueue.queueFormConfirmationEmail(confirmationData);

      expect(result.success).toBe(true);
      expect(result.emailId).toBe('confirmation-123');

      expect(mockEmailService.sendFormConfirmation).toHaveBeenCalledWith({
        to: confirmationData.to,
        ownerName: confirmationData.ownerName,
        templateName: confirmationData.templateName,
        submittedAt: confirmationData.submittedAt,
        ownerEmail: confirmationData.ownerEmail,
      });

      expect(mockAuditService.log).toHaveBeenCalledWith({
        entityType: 'FormInstance',
        entityId: confirmationData.instanceId,
        action: 'email_sent',
        actorType: 'SYSTEM',
        actorId: 'email_service',
        ipAddress: confirmationData.ipAddress,
        userAgent: confirmationData.userAgent,
        metadata: {
          emailType: 'form_confirmation',
          recipientEmail: confirmationData.to,
          emailId: 'confirmation-123',
          success: true,
        },
      });
    });

    it('should handle confirmation email failures', async () => {
      mockEmailService.sendFormConfirmation.mockResolvedValue({
        success: false,
        error: 'Email service unavailable',
      });

      const result = await emailQueue.queueFormConfirmationEmail(confirmationData, { maxRetries: 0 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service unavailable');

      expect(mockAuditService.log).toHaveBeenCalledWith({
        entityType: 'FormInstance',
        entityId: confirmationData.instanceId,
        action: 'email_failed',
        actorType: 'SYSTEM',
        actorId: 'email_service',
        ipAddress: confirmationData.ipAddress,
        userAgent: confirmationData.userAgent,
        metadata: {
          emailType: 'form_confirmation',
          recipientEmail: confirmationData.to,
          error: 'Email service unavailable',
          success: false,
        },
      });
    });
  });

  describe('error handling', () => {
    it('should handle audit service failures gracefully', async () => {
      mockEmailService.sendFormLink.mockResolvedValue({
        success: true,
        emailId: 'email-123',
      });

      mockAuditService.log.mockRejectedValue(new Error('Audit service down'));

      const result = await emailQueue.queueFormLinkEmail({
        instanceId: 'instance-123',
        to: 'client@example.com',
        formUrl: 'https://example.com/forms/token123',
        ownerName: 'Test Services',
        templateName: 'Test Form',
        expiresAt: new Date(),
        ownerId: 'owner-123',
      });

      // Email should still succeed even if audit logging fails
      expect(result.success).toBe(true);
      expect(result.emailId).toBe('email-123');
    });
  });
});