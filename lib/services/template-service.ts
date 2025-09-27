import { PrismaClient, FormTemplate } from '@prisma/client';

export class TemplateService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all active templates, ordered by name
   */
  async getAllTemplates(): Promise<FormTemplate[]> {
    return this.prisma.formTemplate.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get template by UUID
   */
  async getTemplateById(id: string): Promise<FormTemplate | null> {
    try {
      return await this.prisma.formTemplate.findUnique({
        where: {
          id,
          isActive: true,
        },
      });
    } catch (error) {
      // Invalid UUID format
      return null;
    }
  }

  /**
   * Get template by slug
   */
  async getTemplateBySlug(slug: string): Promise<FormTemplate | null> {
    return this.prisma.formTemplate.findUnique({
      where: {
        slug,
        isActive: true,
      },
    });
  }

  /**
   * Find template by ID or slug
   * Automatically detects if the identifier is a UUID or slug
   */
  async findTemplate(identifier: string): Promise<FormTemplate | null> {
    // Check if identifier looks like a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(identifier)) {
      return this.getTemplateById(identifier);
    } else {
      return this.getTemplateBySlug(identifier);
    }
  }

  /**
   * Get count of active templates
   */
  async getTemplateCount(): Promise<number> {
    return this.prisma.formTemplate.count({
      where: {
        isActive: true,
      },
    });
  }

  /**
   * Check if template exists and is active
   */
  async templateExists(identifier: string): Promise<boolean> {
    const template = await this.findTemplate(identifier);
    return template !== null;
  }

  /**
   * Create a new template
   */
  async createTemplate(data: {
    id: string;
    name: string;
    slug: string;
    description: string;
    fieldSchema: any;
    uiSchema: any;
    version: number;
    isActive: boolean;
  }): Promise<FormTemplate> {
    return this.prisma.formTemplate.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        fieldSchema: data.fieldSchema,
        uiSchema: data.uiSchema,
        version: data.version,
        isActive: data.isActive,
      },
    });
  }
}