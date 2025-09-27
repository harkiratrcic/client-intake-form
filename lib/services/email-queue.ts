import { PrismaClient } from '@prisma/client';
import { EmailService, EmailResult } from './email-service';
import { AuditService } from './audit-service';

export interface QueueFormLinkEmailData {
  instanceId: string;
  to: string;
  formUrl: string;
  personalMessage?: string;
  ownerName: string;
  templateName: string;
  expiresAt: Date;
  ownerId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface QueueFormConfirmationEmailData {
  instanceId: string;
  to: string;
  ownerName: string;
  templateName: string;
  submittedAt: Date;
  ownerEmail: string;
  ownerId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface EmailQueueOptions {
  maxRetries?: number;
  retryDelayMs?: number;
}

export class EmailQueue {
  private emailService: EmailService;
  private auditService: AuditService;

  constructor(private prisma: PrismaClient) {
    this.emailService = new EmailService();
    this.auditService = new AuditService(prisma);
  }

  /**
   * Queue and send form link email with retry logic
   */
  async queueFormLinkEmail(
    data: QueueFormLinkEmailData,
    options: EmailQueueOptions = {}
  ): Promise<EmailResult> {
    const { maxRetries = 3, retryDelayMs = 1000 } = options;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.emailService.sendFormLink({
          to: data.to,
          formUrl: data.formUrl,
          personalMessage: data.personalMessage,
          ownerName: data.ownerName,
          templateName: data.templateName,
          expiresAt: data.expiresAt,
        });

        if (result.success) {
          // Log successful email
          await this.logEmailEvent(data, {
            emailType: 'form_link',
            action: 'email_sent',
            success: true,
            emailId: result.emailId,
          });

          return result;
        } else {
          // Log failure
          await this.logEmailEvent(data, {
            emailType: 'form_link',
            action: 'email_failed',
            success: false,
            error: result.error,
          });

          // If this is the last attempt, return the failure
          if (attempt === maxRetries) {
            return result;
          }

          // Wait before retrying (except on last attempt)
          if (attempt < maxRetries) {
            await this.delay(retryDelayMs * (attempt + 1)); // Exponential backoff
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        await this.logEmailEvent(data, {
          emailType: 'form_link',
          action: 'email_failed',
          success: false,
          error: errorMessage,
        });

        // If this is the last attempt, return the failure
        if (attempt === maxRetries) {
          return {
            success: false,
            error: errorMessage,
          };
        }

        // Wait before retrying
        if (attempt < maxRetries) {
          await this.delay(retryDelayMs * (attempt + 1));
        }
      }
    }

    // Should not reach here, but TypeScript needs this
    return {
      success: false,
      error: 'Max retries exceeded',
    };
  }

  /**
   * Queue and send form confirmation email
   */
  async queueFormConfirmationEmail(
    data: QueueFormConfirmationEmailData,
    options: EmailQueueOptions = {}
  ): Promise<EmailResult> {
    const { maxRetries = 3, retryDelayMs = 1000 } = options;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.emailService.sendFormConfirmation({
          to: data.to,
          ownerName: data.ownerName,
          templateName: data.templateName,
          submittedAt: data.submittedAt,
          ownerEmail: data.ownerEmail,
        });

        if (result.success) {
          // Log successful email
          await this.logEmailEvent(data, {
            emailType: 'form_confirmation',
            action: 'email_sent',
            success: true,
            emailId: result.emailId,
          });

          return result;
        } else {
          // Log failure
          await this.logEmailEvent(data, {
            emailType: 'form_confirmation',
            action: 'email_failed',
            success: false,
            error: result.error,
          });

          // If this is the last attempt, return the failure
          if (attempt === maxRetries) {
            return result;
          }

          // Wait before retrying
          if (attempt < maxRetries) {
            await this.delay(retryDelayMs * (attempt + 1));
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        await this.logEmailEvent(data, {
          emailType: 'form_confirmation',
          action: 'email_failed',
          success: false,
          error: errorMessage,
        });

        // If this is the last attempt, return the failure
        if (attempt === maxRetries) {
          return {
            success: false,
            error: errorMessage,
          };
        }

        // Wait before retrying
        if (attempt < maxRetries) {
          await this.delay(retryDelayMs * (attempt + 1));
        }
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
    };
  }

  /**
   * Log email event to audit trail
   */
  private async logEmailEvent(
    data: QueueFormLinkEmailData | QueueFormConfirmationEmailData,
    eventData: {
      emailType: 'form_link' | 'form_confirmation';
      action: 'email_sent' | 'email_failed';
      success: boolean;
      emailId?: string;
      error?: string;
    }
  ): Promise<void> {
    try {
      await this.auditService.log({
        entityType: 'FormInstance',
        entityId: data.instanceId,
        action: eventData.action,
        actorType: 'SYSTEM',
        actorId: 'email_service',
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: {
          emailType: eventData.emailType,
          recipientEmail: data.to,
          success: eventData.success,
          ...(eventData.emailId && { emailId: eventData.emailId }),
          ...(eventData.error && { error: eventData.error }),
        },
      });
    } catch (error) {
      // Don't let audit failures break email sending
      console.error('Failed to log email event:', error);
    }
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}