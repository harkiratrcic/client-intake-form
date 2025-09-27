import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock Prisma
jest.mock('../../../../../lib/db', () => ({
  prisma: {
    formInstance: {
      findUnique: jest.fn(),
    },
  },
}));

const { prisma } = require('../../../../../lib/db');

const mockFormInstance = {
  id: 'form-123',
  token: 'test-token',
  status: 'draft',
  formData: { name: 'John Doe' },
  expiresAt: new Date(),
  template: {
    id: 'template-1',
    name: 'Test Template',
    schema: { type: 'object' },
    uiSchema: { 'ui:order': ['name'] },
  },
  owner: {
    id: 'owner-1',
    name: 'Test Owner',
    email: 'owner@test.com',
    rcicNumber: 'R123456',
  },
};

describe('/api/forms/[token] GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return form instance for valid token', async () => {
    prisma.formInstance.findUnique.mockResolvedValue(mockFormInstance);

    const request = new NextRequest('http://localhost:3000/api/forms/test-token');
    const response = await GET(request, { params: { token: 'test-token' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      id: 'form-123',
      token: 'test-token',
      status: 'draft',
      formData: { name: 'John Doe' },
      expiresAt: mockFormInstance.expiresAt.toISOString(),
      template: {
        id: 'template-1',
        name: 'Test Template',
        schema: { type: 'object' },
        uiSchema: { 'ui:order': ['name'] },
      },
      owner: {
        id: 'owner-1',
        name: 'Test Owner',
        email: 'owner@test.com',
        rcicNumber: 'R123456',
      },
    });
  });

  it('should return 404 for non-existent token', async () => {
    prisma.formInstance.findUnique.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/forms/invalid-token');
    const response = await GET(request, { params: { token: 'invalid-token' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Form not found');
  });

  it('should return 400 for missing token', async () => {
    const request = new NextRequest('http://localhost:3000/api/forms/');
    const response = await GET(request, { params: { token: '' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Token is required');
  });

  it('should handle database errors', async () => {
    prisma.formInstance.findUnique.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/forms/test-token');
    const response = await GET(request, { params: { token: 'test-token' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});