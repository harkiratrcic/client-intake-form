import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find form instance by secureToken
    const formInstance = await prisma.formInstance.findUnique({
      where: { secureToken: token },
      include: {
        template: true,
        owner: {
          select: {
            id: true,
            businessName: true,
            email: true,
            rcicNumber: true,
          },
        },
        response: true,
      },
    });

    if (!formInstance) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }

    // Return form instance data
    return NextResponse.json({
      id: formInstance.id,
      token: formInstance.secureToken,
      status: formInstance.status,
      formData: formInstance.response?.draftData || {},
      expiresAt: formInstance.expiresAt.toISOString(),
      template: {
        id: formInstance.template.id,
        name: formInstance.template.name,
        schema: formInstance.template.fieldSchema,
        uiSchema: formInstance.template.uiSchema,
      },
      owner: {
        id: formInstance.owner.id,
        name: formInstance.owner.businessName || 'FormFlow User',
        email: formInstance.owner.email,
        rcicNumber: formInstance.owner.rcicNumber || '',
      },
    });

  } catch (error) {
    console.error('Error fetching form instance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}