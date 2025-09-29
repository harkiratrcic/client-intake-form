import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { CreateFormInstanceSchema } from '@/lib/validation/forms';
import { FormInstanceService } from '@/lib/services/form-instance-service';
import { EmailQueue } from '@/lib/services/email-queue';
import { getOwnerFromRequest } from '@/lib/auth/utils';

const prisma = new PrismaClient();
const formInstanceService = new FormInstanceService(prisma);
const emailQueue = new EmailQueue(prisma);

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();

    // Pre-process the email for trimming and lowercasing
    if (body.clientEmail && typeof body.clientEmail === 'string') {
      body.clientEmail = body.clientEmail.trim().toLowerCase();
    }

    const validationResult = CreateFormInstanceSchema.safeParse(body);

    if (!validationResult.success) {
      // Get first error message for better user experience
      const issues = validationResult.error.issues || [];
      const firstIssue = issues[0];
      const errorMessage = firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Validation failed';

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { templateId, clientEmail, personalMessage, expiryDays } = validationResult.data;

    // Get authenticated owner ID
    const ownerId = request.headers.get('x-owner-id');
    if (!ownerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Owner authentication required',
        },
        { status: 401 }
      );
    }

    // Get client IP and user agent for audit logging
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create form instance
    const result = await formInstanceService.createInstance({
      templateId,
      ownerId,
      clientEmail,
      personalMessage,
      expiryDays,
      ipAddress,
      userAgent,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    // Generate form URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Warn if using default URL in production
    if (!process.env.NEXT_PUBLIC_APP_URL && process.env.NODE_ENV === 'production') {
      console.error('⚠️ NEXT_PUBLIC_APP_URL is not set! Forms will have incorrect URLs in production.');
      console.error('⚠️ Please set NEXT_PUBLIC_APP_URL in your Vercel environment variables.');
    }

    const formUrl = `${baseUrl}/f/${result.instance.secureToken}`;

    // Log form URL for debugging
    console.log('📧 Form URL generated:', formUrl);

    // Get owner info for email
    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
      select: { businessName: true },
    });

    const ownerName = owner?.businessName || 'Immigration Services';

    // Get template info for email
    const template = await prisma.formTemplate.findUnique({
      where: { id: templateId },
      select: { name: true },
    });

    const templateName = template?.name || 'Form';

    // Send form link email
    const emailResult = await emailQueue.queueFormLinkEmail({
      instanceId: result.instance.id,
      to: clientEmail,
      formUrl,
      personalMessage,
      ownerName,
      templateName,
      expiresAt: result.instance.expiresAt,
      ownerId,
      ipAddress,
      userAgent,
    });

    let emailMessage = 'Form created successfully. Email sent to client.';
    if (!emailResult.success) {
      console.warn('Failed to send form link email:', emailResult.error);
      emailMessage = 'Form created successfully. Warning: Email could not be sent.';
    }

    return NextResponse.json(
      {
        success: true,
        formInstance: result.instance,
        formUrl,
        message: emailMessage,
        emailSent: emailResult.success,
        ...(emailResult.success && { emailId: emailResult.emailId }),
        ...(!emailResult.success && { emailError: emailResult.error }),
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating form instance:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}