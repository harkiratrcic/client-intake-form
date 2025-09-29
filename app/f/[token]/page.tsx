import { notFound } from 'next/navigation';
import { FormPageClient } from './form-client';
import { prisma } from '@/lib/prisma';

interface FormInstance {
  id: string;
  token: string;
  status: 'draft' | 'submitted';
  formData: Record<string, any>;
  expiresAt: string;
  template: {
    id: string;
    name: string;
    schema: any;
    uiSchema?: any;
  };
  owner: {
    id: string;
    name: string;
    email: string;
    rcicNumber: string;
  };
}

async function getFormInstance(token: string): Promise<FormInstance | null> {
  try {
    // Access database directly instead of making HTTP request
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
      return null;
    }

    return {
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
    };
  } catch (error) {
    console.error('Error fetching form instance:', error);
    return null;
  }
}

interface Props {
  params: Promise<{
    token: string;
  }>;
}

export default async function FormPage({ params }: Props) {
  const { token } = await params;
  const formInstance = await getFormInstance(token);

  if (!formInstance) {
    notFound();
  }

  return <FormPageClient formInstance={formInstance} />;
}

export async function generateMetadata({ params }: Props) {
  const { token } = await params;
  const formInstance = await getFormInstance(token);

  if (!formInstance) {
    return {
      title: 'Form Not Found',
    };
  }

  return {
    title: `${formInstance.template.name} - ${formInstance.owner.name}`,
    description: `Complete your ${formInstance.template.name} form for ${formInstance.owner.name}.`,
  };
}