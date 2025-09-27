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

export async function GET(request: NextRequest) {
  try {
    // Get authenticated owner ID from middleware-set header
    const ownerId = request.headers.get('x-owner-id');
    if (!ownerId) {
      return errorResponse('Authentication required', 401);
    }

    // Get all active templates
    const templates = await templateService.getAllTemplates();

    // Create response with caching headers
    const response = successResponse({
      templates,
      count: templates.length,
    });

    // Add cache headers for template data (cache for 5 minutes)
    response.headers.set('Cache-Control', 'private, max-age=300');

    return response;

  } catch (error) {
    console.error('Error fetching templates:', error);
    return internalErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated owner ID from middleware-set header
    const ownerId = request.headers.get('x-owner-id');
    if (!ownerId) {
      return errorResponse('Authentication required', 401);
    }

    // Parse request body
    const body = await request.json();
    const { name, description, category, fields } = body;

    if (!name || !description || !fields || !Array.isArray(fields)) {
      return errorResponse('Missing required fields: name, description, fields', 400);
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Create JSON schema from fields
    const fieldSchema = {
      type: 'object',
      properties: {},
      required: []
    };

    const uiSchema = {};

    fields.forEach((field: any) => {
      if (!field.name || !field.label || !field.type) return;

      fieldSchema.properties[field.name] = {
        type: field.type === 'number' ? 'number' : field.type === 'date' ? 'string' : 'string',
        title: field.label
      };

      if (field.type === 'date') {
        fieldSchema.properties[field.name].format = 'date';
      } else if (field.type === 'email') {
        fieldSchema.properties[field.name].format = 'email';
      }

      if (field.required) {
        fieldSchema.required.push(field.name);
      }

      if (field.type === 'textarea') {
        uiSchema[field.name] = { 'ui:widget': 'textarea' };
      }
    });

    // Create template using template service
    const template = await templateService.createTemplate({
      id: slug,
      name,
      slug,
      description,
      fieldSchema,
      uiSchema,
      version: 1,
      isActive: true
    });

    return successResponse({ template });

  } catch (error) {
    console.error('Error creating template:', error);
    return internalErrorResponse(error);
  }
}