import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { TemplateService } from '../template-service';
import { seedTemplates } from '@/prisma/seed';

describe('TemplateService', () => {
  let prisma: PrismaClient;
  let templateService: TemplateService;
  let testTemplateId: string;

  beforeEach(async () => {
    prisma = new PrismaClient();
    templateService = new TemplateService(prisma);

    // Clear and seed templates
    await prisma.formTemplate.deleteMany();
    await seedTemplates(prisma);

    // Get a template ID for testing
    const template = await prisma.formTemplate.findFirst();
    testTemplateId = template?.id || '';
  });

  afterEach(async () => {
    await prisma.formTemplate.deleteMany();
    await prisma.$disconnect();
  });

  describe('getAllTemplates', () => {
    it('should return all active templates', async () => {
      const templates = await templateService.getAllTemplates();

      expect(templates).toHaveLength(3);
      templates.forEach(template => {
        expect(template.isActive).toBe(true);
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('slug');
        expect(template).toHaveProperty('fieldSchema');
      });
    });

    it('should not return inactive templates', async () => {
      // Deactivate one template
      await prisma.formTemplate.update({
        where: { slug: 'basic-info' },
        data: { isActive: false },
      });

      const templates = await templateService.getAllTemplates();

      expect(templates).toHaveLength(2);
      const basicInfo = templates.find(t => t.slug === 'basic-info');
      expect(basicInfo).toBeUndefined();
    });

    it('should return templates in alphabetical order by name', async () => {
      const templates = await templateService.getAllTemplates();

      // Should be sorted alphabetically
      expect(templates[0].name).toBe('Basic Information');
      expect(templates[1].name).toBe('Document Checklist');
      expect(templates[2].name).toBe('Initial Assessment');
    });
  });

  describe('getTemplateById', () => {
    it('should return template by UUID', async () => {
      const template = await templateService.getTemplateById(testTemplateId);

      expect(template).toBeDefined();
      expect(template?.id).toBe(testTemplateId);
      expect(template?.fieldSchema).toBeDefined();
      expect(template?.uiSchema).toBeDefined();
    });

    it('should return null for non-existent ID', async () => {
      const template = await templateService.getTemplateById('non-existent-id');
      expect(template).toBeNull();
    });

    it('should return null for inactive template', async () => {
      await prisma.formTemplate.update({
        where: { id: testTemplateId },
        data: { isActive: false },
      });

      const template = await templateService.getTemplateById(testTemplateId);
      expect(template).toBeNull();
    });
  });

  describe('getTemplateBySlug', () => {
    it('should return template by slug', async () => {
      const template = await templateService.getTemplateBySlug('basic-info');

      expect(template).toBeDefined();
      expect(template?.slug).toBe('basic-info');
      expect(template?.name).toBe('Basic Information');
    });

    it('should return null for non-existent slug', async () => {
      const template = await templateService.getTemplateBySlug('non-existent-slug');
      expect(template).toBeNull();
    });

    it('should return null for inactive template', async () => {
      await prisma.formTemplate.update({
        where: { slug: 'basic-info' },
        data: { isActive: false },
      });

      const template = await templateService.getTemplateBySlug('basic-info');
      expect(template).toBeNull();
    });
  });

  describe('findTemplate', () => {
    it('should find by UUID when given valid UUID format', async () => {
      const template = await templateService.findTemplate(testTemplateId);

      expect(template).toBeDefined();
      expect(template?.id).toBe(testTemplateId);
    });

    it('should find by slug when given non-UUID string', async () => {
      const template = await templateService.findTemplate('basic-info');

      expect(template).toBeDefined();
      expect(template?.slug).toBe('basic-info');
    });

    it('should return null when not found', async () => {
      const template = await templateService.findTemplate('not-found');
      expect(template).toBeNull();
    });
  });

  describe('getTemplateCount', () => {
    it('should return count of active templates', async () => {
      const count = await templateService.getTemplateCount();
      expect(count).toBe(3);
    });

    it('should not count inactive templates', async () => {
      await prisma.formTemplate.update({
        where: { slug: 'basic-info' },
        data: { isActive: false },
      });

      const count = await templateService.getTemplateCount();
      expect(count).toBe(2);
    });
  });
});