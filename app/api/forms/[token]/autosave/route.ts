import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse, internalErrorResponse } from '@/lib/api/response';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return errorResponse('Token is required', 400);
    }

    // Parse request body
    let formData;
    try {
      const body = await request.json();
      formData = body.formData;

      if (!formData || typeof formData !== 'object') {
        return errorResponse('Invalid form data', 400);
      }
    } catch (error) {
      return errorResponse('Invalid request body', 400);
    }

    // Find the form instance
    const formInstance = await prisma.formInstance.findUnique({
      where: { secureToken: token },
      include: { template: true }
    });

    if (!formInstance) {
      return errorResponse('Form not found', 404);
    }

    // Check if form is still active
    if (formInstance.status !== 'SENT' && formInstance.status !== 'IN_PROGRESS') {
      return errorResponse('Form is no longer available for editing', 400);
    }

    // Check if form has expired
    if (formInstance.expiresAt < new Date()) {
      return errorResponse('Form has expired', 400);
    }

    // Update or create form response with auto-save data
    const formResponse = await prisma.formResponse.upsert({
      where: { instanceId: formInstance.id },
      update: {
        responseData: formData,
        lastModifiedAt: new Date(),
        isAutoSave: true
      },
      create: {
        instanceId: formInstance.id,
        responseData: formData,
        submittedAt: null, // Not submitted yet
        lastModifiedAt: new Date(),
        isAutoSave: true
      }
    });

    // Update form instance status to IN_PROGRESS if it was SENT
    if (formInstance.status === 'SENT') {
      await prisma.formInstance.update({
        where: { id: formInstance.id },
        data: {
          status: 'IN_PROGRESS',
          updatedAt: new Date()
        }
      });
    }

    // Log the auto-save action
    await prisma.auditLog.create({
      data: {
        actorType: 'CLIENT',
        action: 'AUTO_SAVE',
        entityType: 'FORM_RESPONSE',
        entityId: formResponse.id,
        details: {
          instanceId: formInstance.id,
          fieldCount: Object.keys(formData).length
        }
      }
    });

    return successResponse({
      message: 'Form auto-saved successfully',
      savedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Auto-save error:', error);
    return internalErrorResponse(error);
  }
}