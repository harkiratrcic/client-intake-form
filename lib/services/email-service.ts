import { Resend } from 'resend';

export interface SendFormLinkData {
  to: string;
  formUrl: string;
  personalMessage?: string;
  ownerName: string;
  templateName: string;
  expiresAt: Date;
}

export interface SendConfirmationData {
  to: string;
  ownerName: string;
  templateName: string;
  submittedAt: Date;
  ownerEmail: string;
}

export type EmailResult = {
  success: true;
  emailId: string;
} | {
  success: false;
  error: string;
};

export interface EmailTemplate {
  html: string;
  text: string;
}

export class EmailService {
  private resend: Resend | null;
  private fromEmail: string;
  private isDevelopment: boolean;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.isDevelopment = process.env.NODE_ENV === 'development';

    // In development or build time, allow operation without valid API key
    if (!apiKey || apiKey === 're_test_placeholder_key_for_build') {
      if (this.isDevelopment || process.env.NODE_ENV === 'production') {
        this.resend = null;
        if (this.isDevelopment) {
          console.warn('⚠️  Development mode: Email service disabled. Set RESEND_API_KEY for email functionality.');
        }
      } else {
        throw new Error('RESEND_API_KEY environment variable is required');
      }
    } else {
      this.resend = new Resend(apiKey);
    }

    this.fromEmail = process.env.EMAIL_FROM || 'noreply@formflow.ca';
  }

  /**
   * Send form link email to client
   */
  async sendFormLink(data: SendFormLinkData): Promise<EmailResult> {
    try {
      if (!this.validateEmailAddress(data.to)) {
        return {
          success: false,
          error: 'Invalid email address',
        };
      }

      // Development mode: simulate email sending
      if (!this.resend) {
        console.log('📧 [DEV MODE] Email would be sent to:', data.to);
        console.log('📧 [DEV MODE] Form URL:', data.formUrl);
        console.log('📧 [DEV MODE] Template:', data.templateName);
        console.log('📧 [DEV MODE] Personal message:', data.personalMessage || 'None');

        return {
          success: true,
          emailId: `dev-email-${Date.now()}`,
        };
      }

      const template = this.getFormLinkTemplate(data);

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: data.to,
        subject: `Please complete your form: ${data.templateName}`,
        html: template.html,
        text: template.text,
      });

      if (result.error) {
        return {
          success: false,
          error: result.error.message,
        };
      }

      return {
        success: true,
        emailId: result.data!.id,
      };

    } catch (error) {
      console.error('Error sending form link email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send form confirmation email to client
   */
  async sendFormConfirmation(data: SendConfirmationData): Promise<EmailResult> {
    try {
      if (!this.validateEmailAddress(data.to)) {
        return {
          success: false,
          error: 'Invalid email address',
        };
      }

      // Development mode: simulate email sending
      if (!this.resend) {
        console.log('📧 [DEV MODE] Confirmation email would be sent to:', data.to);
        console.log('📧 [DEV MODE] Template:', data.templateName);
        console.log('📧 [DEV MODE] Submitted at:', data.submittedAt);

        return {
          success: true,
          emailId: `dev-confirmation-${Date.now()}`,
        };
      }

      const template = this.getConfirmationTemplate(data);

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: data.to,
        subject: `Form submitted: ${data.templateName}`,
        html: template.html,
        text: template.text,
      });

      if (result.error) {
        return {
          success: false,
          error: result.error.message,
        };
      }

      return {
        success: true,
        emailId: result.data!.id,
      };

    } catch (error) {
      console.error('Error sending confirmation email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate email address format
   */
  validateEmailAddress(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Generate form link email template
   */
  getFormLinkTemplate(data: SendFormLinkData): EmailTemplate {
    const expiryFormatted = data.expiresAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const personalMessageSection = data.personalMessage
      ? `<p><em>${data.personalMessage}</em></p>`
      : '';

    const personalMessageText = data.personalMessage
      ? `\n${data.personalMessage}\n`
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Please Complete Your Form</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h1 style="color: #2c3e50; margin-bottom: 20px;">Please Complete Your Form</h1>

          <p>Hello,</p>

          <p>You have been invited by <strong>${data.ownerName}</strong> to complete the following form:</p>

          <div style="background-color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #3498db; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #2c3e50;">${data.templateName}</h3>
          </div>

          ${personalMessageSection}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.formUrl}"
               style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Complete Form
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">
            <strong>Important:</strong> This form link expires on <strong>${expiryFormatted}</strong>.
            Please complete it before the expiry date.
          </p>

          <p style="color: #666; font-size: 14px;">
            If you're unable to click the button above, you can copy and paste this link into your browser:<br>
            <a href="${data.formUrl}" style="color: #3498db; word-break: break-all;">${data.formUrl}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #666; font-size: 12px;">
            This email was sent by ${data.ownerName}. If you have any questions, please contact them directly.
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `
Please Complete Your Form

Hello,

You have been invited by ${data.ownerName} to complete the following form:

${data.templateName}
${personalMessageText}
To complete the form, please visit: ${data.formUrl}

Important: This form link expires on ${expiryFormatted}. Please complete it before the expiry date.

This email was sent by ${data.ownerName}. If you have any questions, please contact them directly.
    `.trim();

    return { html, text };
  }

  /**
   * Generate form confirmation email template
   */
  getConfirmationTemplate(data: SendConfirmationData): EmailTemplate {
    const submittedFormatted = data.submittedAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Form Submission Confirmed</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h1 style="color: #27ae60; margin-bottom: 20px;">✓ Form Submission Confirmed</h1>

          <p>Hello,</p>

          <p>Thank you for submitting your form. We have successfully received your information.</p>

          <div style="background-color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #27ae60; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Submission Details</h3>
            <p style="margin: 5px 0;"><strong>Form:</strong> ${data.templateName}</p>
            <p style="margin: 5px 0;"><strong>Submitted:</strong> ${submittedFormatted}</p>
            <p style="margin: 5px 0;"><strong>Submitted to:</strong> ${data.ownerName}</p>
          </div>

          <p>Your information has been securely transmitted and will be reviewed by our team. We will contact you if any additional information is needed.</p>

          <div style="background-color: #e8f4fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #2c3e50;">
              <strong>Next Steps:</strong> We will review your submission and contact you within the next business day if we need any clarification or additional documents.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #666; font-size: 12px;">
            If you have any questions about your submission, please contact:<br>
            <strong>${data.ownerName}</strong><br>
            Email: <a href="mailto:${data.ownerEmail}" style="color: #3498db;">${data.ownerEmail}</a>
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `
Form Submission Confirmed

Hello,

Thank you for submitting your form. We have successfully received your information.

Submission Details:
- Form: ${data.templateName}
- Submitted: ${submittedFormatted}
- Submitted to: ${data.ownerName}

Your information has been securely transmitted and will be reviewed by our team. We will contact you if any additional information is needed.

Next Steps: We will review your submission and contact you within the next business day if we need any clarification or additional documents.

If you have any questions about your submission, please contact:
${data.ownerName}
Email: ${data.ownerEmail}
    `.trim();

    return { html, text };
  }
}