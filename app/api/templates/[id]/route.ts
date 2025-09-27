import { NextRequest } from 'next/server';
import { TemplateService } from '@/lib/services/template-service';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/get-session';
import {
  successResponse,
  errorResponse,
  internalErrorResponse,
} from '@/lib/api/response';

const templateService = new TemplateService(prisma);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const sessionResult = await getSession(request);
    if (!sessionResult.success) {
      return errorResponse('Authentication required', 401);
    }

    const { id } = params;

    if (!id) {
      return errorResponse('Template ID is required', 400);
    }

    // Find template by ID or slug
    const template = await templateService.findTemplate(id);

    if (!template) {
      return errorResponse('Template not found', 404);
    }

    // Create response with caching headers
    const response = successResponse({
      template,
    });

    // Add cache headers (cache for 10 minutes since individual templates change less frequently)
    response.headers.set('Cache-Control', 'private, max-age=600');

    return response;

  } catch (error) {
    console.error('Error fetching template:', error);
    return internalErrorResponse(error);
  }
}