import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { seedTemplates } from '../seed';

describe('Template Seeding', () => {
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = new PrismaClient();

    // Clear existing templates
    await prisma.formTemplate.deleteMany();
  });

  afterEach(async () => {
    await prisma.formTemplate.deleteMany();
    await prisma.$disconnect();
  });

  it('should seed templates correctly', async () => {
    await seedTemplates(prisma);

    const templates = await prisma.formTemplate.findMany({
      orderBy: { slug: 'asc' }
    });

    expect(templates).toHaveLength(3);

    // Check basic info template
    const basicInfo = templates.find(t => t.slug === 'basic-info');
    expect(basicInfo).toBeDefined();
    expect(basicInfo?.name).toBe('Basic Information');
    expect(basicInfo?.isActive).toBe(true);
    expect(basicInfo?.fieldSchema).toBeDefined();

    // Verify field schema structure
    const schema = basicInfo?.fieldSchema as any;
    expect(schema.type).toBe('object');
    expect(schema.properties).toBeDefined();
    expect(Object.keys(schema.properties)).toContain('email');
    expect(Object.keys(schema.properties)).toContain('fullName');

    // Check document checklist template
    const docChecklist = templates.find(t => t.slug === 'document-checklist');
    expect(docChecklist).toBeDefined();
    expect(docChecklist?.name).toBe('Document Checklist');

    // Check initial assessment template
    const initialAssessment = templates.find(t => t.slug === 'initial-assessment');
    expect(initialAssessment).toBeDefined();
    expect(initialAssessment?.name).toBe('Initial Assessment');
  });

  it('should have valid JSON schemas for all templates', async () => {
    await seedTemplates(prisma);

    const templates = await prisma.formTemplate.findMany();

    for (const template of templates) {
      const schema = template.fieldSchema as any;

      // Basic JSON Schema validation
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(typeof schema.properties).toBe('object');

      // Check that each property has required fields
      for (const [fieldName, fieldSchema] of Object.entries(schema.properties)) {
        expect(fieldSchema).toHaveProperty('type');
        expect(fieldSchema).toHaveProperty('title');
        expect(typeof fieldName).toBe('string');
      }

      // Verify required fields exist
      if (schema.required) {
        expect(Array.isArray(schema.required)).toBe(true);
        schema.required.forEach((field: string) => {
          expect(schema.properties).toHaveProperty(field);
        });
      }
    }
  });

  it('should not duplicate templates on multiple runs', async () => {
    // First run
    await seedTemplates(prisma);
    const firstCount = await prisma.formTemplate.count();

    // Second run (should not add duplicates)
    await seedTemplates(prisma);
    const secondCount = await prisma.formTemplate.count();

    expect(firstCount).toBe(secondCount);
    expect(firstCount).toBe(3);
  });

  it('should have UI schemas for all templates', async () => {
    await seedTemplates(prisma);

    const templates = await prisma.formTemplate.findMany();

    templates.forEach(template => {
      expect(template.uiSchema).toBeDefined();
      const uiSchema = template.uiSchema as any;
      expect(typeof uiSchema).toBe('object');

      // UI schema should have ui:order for better form layout
      expect(uiSchema).toHaveProperty('ui:order');
      expect(Array.isArray(uiSchema['ui:order'])).toBe(true);
    });
  });

  it('should have proper field types and formats', async () => {
    await seedTemplates(prisma);

    const basicInfo = await prisma.formTemplate.findUnique({
      where: { slug: 'basic-info' }
    });

    const schema = basicInfo?.fieldSchema as any;

    // Check email field
    expect(schema.properties.email.type).toBe('string');
    expect(schema.properties.email.format).toBe('email');

    // Check phone field
    expect(schema.properties.phone.type).toBe('string');
    expect(schema.properties.phone.pattern).toBeDefined();

    // Check date fields
    expect(schema.properties.dateOfBirth.type).toBe('string');
    expect(schema.properties.dateOfBirth.format).toBe('date');
  });
});