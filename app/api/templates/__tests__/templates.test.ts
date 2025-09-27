import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { GET as getSingle } from '../[id]/route';
import { PrismaClient } from '@prisma/client';
import { seedTemplates } from '@/prisma/seed';
import { AuthService } from '@/lib/auth/auth-service';
import { hashPassword } from '@/lib/auth/password';

describe('Templates API', () => {
  let prisma: PrismaClient;
  let authService: AuthService;
  let sessionToken: string;
  let testTemplateId: string;

  beforeEach(async () => {
    prisma = new PrismaClient();
    authService = new AuthService(prisma);

    // Clear and seed templates
    await prisma.formTemplate.deleteMany();
    await seedTemplates(prisma);

    // Create test owner and session for authenticated requests
    const owner = await prisma.owner.create({
      data: {
        email: 'test@rcic.ca',
        passwordHash: await hashPassword('TestPass123!'),
        businessName: 'Test Immigration Services',
        isActive: true,
      },
    });

    const loginResult = await authService.login('test@rcic.ca', 'TestPass123!');
    if (loginResult.success) {
      sessionToken = loginResult.session.token;
    }

    // Get a template ID for single template tests
    const template = await prisma.formTemplate.findFirst();
    testTemplateId = template?.id || '';
  });

  afterEach(async () => {
    await prisma.session.deleteMany();
    await prisma.owner.deleteMany();
    await prisma.formTemplate.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/templates', () => {
    it('should return all active templates', async () => {
      const request = new NextRequest('http://localhost/api/templates', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.templates).toBeDefined();
      expect(Array.isArray(data.templates)).toBe(true);
      expect(data.templates.length).toBe(3);

      // Check template structure
      const template = data.templates[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('slug');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('fieldSchema');
      expect(template).toHaveProperty('uiSchema');
      expect(template.isActive).toBe(true);
    });

    it('should require authentication', async () => {
      const request = new NextRequest('http://localhost/api/templates');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
    });

    it('should support caching headers', async () => {
      const request = new NextRequest('http://localhost/api/templates', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      // Should have cache headers for template data
      expect(response.headers.get('Cache-Control')).toBeTruthy();
    });

    it('should filter out inactive templates', async () => {
      // Deactivate one template
      await prisma.formTemplate.update({
        where: { slug: 'basic-info' },
        data: { isActive: false },
      });

      const request = new NextRequest('http://localhost/api/templates', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.templates.length).toBe(2);
      // Should not include the deactivated template
      const basicInfo = data.templates.find((t: any) => t.slug === 'basic-info');
      expect(basicInfo).toBeUndefined();
    });
  });

  describe('GET /api/templates/[id]', () => {
    it('should return specific template by ID', async () => {
      const request = new NextRequest(`http://localhost/api/templates/${testTemplateId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      const response = await getSingle(request, { params: { id: testTemplateId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.template).toBeDefined();
      expect(data.template.id).toBe(testTemplateId);
      expect(data.template.fieldSchema).toBeDefined();
      expect(data.template.uiSchema).toBeDefined();
    });

    it('should return template by slug', async () => {
      const request = new NextRequest('http://localhost/api/templates/basic-info', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      const response = await getSingle(request, { params: { id: 'basic-info' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.template).toBeDefined();
      expect(data.template.slug).toBe('basic-info');
      expect(data.template.name).toBe('Basic Information');
    });

    it('should return 404 for non-existent template', async () => {
      const request = new NextRequest('http://localhost/api/templates/non-existent', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      const response = await getSingle(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Template not found');
    });

    it('should return 404 for inactive template', async () => {
      // Deactivate template
      await prisma.formTemplate.update({
        where: { id: testTemplateId },
        data: { isActive: false },
      });

      const request = new NextRequest(`http://localhost/api/templates/${testTemplateId}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      const response = await getSingle(request, { params: { id: testTemplateId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Template not found');
    });

    it('should require authentication', async () => {
      const request = new NextRequest(`http://localhost/api/templates/${testTemplateId}`);

      const response = await getSingle(request, { params: { id: testTemplateId } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
    });
  });
});