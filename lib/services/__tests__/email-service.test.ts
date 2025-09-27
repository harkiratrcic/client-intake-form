import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { EmailService } from '../email-service';
import { Resend } from 'resend';

// Mock Resend
jest.mock('resend');
const MockedResend = Resend as jest.MockedClass<typeof Resend>;

describe('EmailService', () => {
  let emailService: EmailService;
  let mockResend: jest.Mocked<Resend>;
  let mockSend: jest.MockedFunction<any>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock send function
    mockSend = jest.fn();

    // Mock Resend constructor and emails.send method
    mockResend = {
      emails: {
        send: mockSend,
      },
    } as any;

    MockedResend.mockImplementation(() => mockResend);

    // Create EmailService instance
    emailService = new EmailService();
  });

  describe('sendFormLink', () => {
    const formLinkData = {
      to: 'client@example.com',
      formUrl: 'https://example.com/forms/abc123token',
      personalMessage: 'Please complete this form at your earliest convenience.',
      ownerName: 'Test Immigration Services',
      templateName: 'Basic Information Form',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    };

    it('should send form link email successfully', async () => {
      // Mock successful email send
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      const result = await emailService.sendFormLink(formLinkData);

      expect(result.success).toBe(true);
      expect(result.emailId).toBe('email-123');

      // Verify Resend was called with correct data
      expect(mockSend).toHaveBeenCalledWith({
        from: 'test@formflow.ca', // Uses FROM_EMAIL from test environment
        to: formLinkData.to,
        subject: 'Please complete your form: Basic Information Form',
        html: expect.stringContaining(formLinkData.formUrl),
        text: expect.stringContaining(formLinkData.formUrl),
      });
    });

    it('should handle email send failure', async () => {
      // Mock email send failure
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Invalid email address' },
      });

      const result = await emailService.sendFormLink(formLinkData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email address');
    });

    it('should handle Resend API exceptions', async () => {
      // Mock API exception
      mockSend.mockRejectedValue(new Error('Network error'));

      const result = await emailService.sendFormLink(formLinkData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should include personal message in email', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      await emailService.sendFormLink(formLinkData);

      const emailCall = mockSend.mock.calls[0][0];
      expect(emailCall.html).toContain(formLinkData.personalMessage);
      expect(emailCall.text).toContain(formLinkData.personalMessage);
    });

    it('should format expiry date in email', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      await emailService.sendFormLink(formLinkData);

      const emailCall = mockSend.mock.calls[0][0];
      expect(emailCall.html).toContain('expires on');
      expect(emailCall.text).toContain('expires on');
    });

    it('should work without personal message', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null,
      });

      const dataWithoutMessage = { ...formLinkData };
      delete dataWithoutMessage.personalMessage;

      const result = await emailService.sendFormLink(dataWithoutMessage);

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('sendFormConfirmation', () => {
    const confirmationData = {
      to: 'client@example.com',
      ownerName: 'Test Immigration Services',
      templateName: 'Basic Information Form',
      submittedAt: new Date(),
      ownerEmail: 'owner@rcic.ca',
    };

    it('should send confirmation email successfully', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-456' },
        error: null,
      });

      const result = await emailService.sendFormConfirmation(confirmationData);

      expect(result.success).toBe(true);
      expect(result.emailId).toBe('email-456');

      expect(mockSend).toHaveBeenCalledWith({
        from: 'test@formflow.ca', // Uses FROM_EMAIL from test environment
        to: confirmationData.to,
        subject: 'Form submitted: Basic Information Form',
        html: expect.stringContaining('Thank you for submitting'),
        text: expect.stringContaining('Thank you for submitting'),
      });
    });

    it('should include owner contact information', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-456' },
        error: null,
      });

      await emailService.sendFormConfirmation(confirmationData);

      const emailCall = mockSend.mock.calls[0][0];
      expect(emailCall.html).toContain(confirmationData.ownerName);
      expect(emailCall.html).toContain(confirmationData.ownerEmail);
    });

    it('should handle confirmation email failures', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Rate limit exceeded' },
      });

      const result = await emailService.sendFormConfirmation(confirmationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });
  });

  describe('validateEmailAddress', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
      ];

      validEmails.forEach(email => {
        expect(emailService.validateEmailAddress(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user space@domain.com',
        '',
      ];

      invalidEmails.forEach(email => {
        expect(emailService.validateEmailAddress(email)).toBe(false);
      });
    });
  });

  describe('getEmailTemplate', () => {
    it('should generate form link template', () => {
      const template = emailService.getFormLinkTemplate({
        formUrl: 'https://example.com/forms/token123',
        ownerName: 'Test Services',
        templateName: 'Test Form',
        personalMessage: 'Please complete this form.',
        expiresAt: new Date('2024-01-15T10:00:00Z'),
      });

      expect(template.html).toContain('https://example.com/forms/token123');
      expect(template.html).toContain('Test Services');
      expect(template.html).toContain('Test Form');
      expect(template.html).toContain('Please complete this form.');
      expect(template.text).toContain('https://example.com/forms/token123');
    });

    it('should generate confirmation template', () => {
      const template = emailService.getConfirmationTemplate({
        ownerName: 'Test Services',
        templateName: 'Test Form',
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        ownerEmail: 'owner@rcic.ca',
      });

      expect(template.html).toContain('Test Services');
      expect(template.html).toContain('Test Form');
      expect(template.html).toContain('owner@rcic.ca');
      expect(template.text).toContain('Test Services');
    });
  });
});