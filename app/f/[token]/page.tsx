import { notFound } from 'next/navigation';
import { FormPageClient } from './form-client';

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
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Fetch form instance
    const formResponse = await fetch(`${baseUrl}/api/forms/${token}`, {
      cache: 'no-store',
    });

    if (!formResponse.ok) {
      if (formResponse.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch form: ${formResponse.status}`);
    }

    const formInstance = await formResponse.json();

    // Fetch draft data if form is not completed
    if (formInstance.status !== 'submitted') {
      try {
        const draftResponse = await fetch(`${baseUrl}/api/forms/${token}/draft`, {
          cache: 'no-store',
        });

        if (draftResponse.ok) {
          const draftResult = await draftResponse.json();

          // Merge draft data with form data if draft exists
          if (draftResult.draftData && Object.keys(draftResult.draftData).length > 0) {
            formInstance.formData = { ...formInstance.formData, ...draftResult.draftData };
          }
        }
      } catch (draftError) {
        console.warn('Failed to fetch draft data, using original form data:', draftError);
      }
    }

    return formInstance;
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