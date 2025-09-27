import { prisma } from '../prisma';

export interface SaveDraftResult {
  success: boolean;
  lastSavedAt?: Date;
  error?: string;
}

export interface GetDraftResult {
  draftData?: any;
  lastSavedAt?: Date | null;
  status?: string;
  error?: string;
}

/**
 * Save draft data for a form instance
 */
export async function saveDraft(token: string, draftData: any): Promise<SaveDraftResult> {
  try {
    // Find form instance by secure token
    const formInstance = await prisma.formInstance.findUnique({
      where: { secureToken: token },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        response: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!formInstance) {
      return { success: false, error: 'Form not found' };
    }

    // Check if form is expired
    if (formInstance.expiresAt < new Date()) {
      return { success: false, error: 'Form has expired' };
    }

    // Check if form is already submitted
    if (formInstance.status === 'COMPLETED') {
      return { success: false, error: 'Form has already been submitted' };
    }

    const now = new Date();

    // Update or create form response with draft data
    const response = await prisma.formResponse.upsert({
      where: {
        instanceId: formInstance.id,
      },
      update: {
        draftData,
        lastSavedAt: now,
      },
      create: {
        instanceId: formInstance.id,
        draftData,
        lastSavedAt: now,
      },
    });

    // Update form instance status to IN_PROGRESS if it's still SENT
    if (formInstance.status === 'SENT') {
      await prisma.formInstance.update({
        where: { id: formInstance.id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return {
      success: true,
      lastSavedAt: response.lastSavedAt,
    };

  } catch (error) {
    console.error('Error saving draft:', error);
    return { success: false, error: 'Failed to save draft' };
  }
}

/**
 * Get draft data for a form instance
 */
export async function getDraft(token: string): Promise<GetDraftResult> {
  try {
    // Find form instance by secure token
    const formInstance = await prisma.formInstance.findUnique({
      where: { secureToken: token },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        response: {
          select: {
            draftData: true,
            lastSavedAt: true,
          },
        },
      },
    });

    if (!formInstance) {
      return { error: 'Form not found' };
    }

    // Check if form is expired
    if (formInstance.expiresAt < new Date()) {
      return { error: 'Form has expired' };
    }

    return {
      draftData: formInstance.response?.draftData || {},
      lastSavedAt: formInstance.response?.lastSavedAt || null,
      status: formInstance.status,
    };

  } catch (error) {
    console.error('Error retrieving draft:', error);
    return { error: 'Failed to retrieve draft' };
  }
}

/**
 * Clear draft data for a form instance
 */
export async function clearDraft(token: string): Promise<SaveDraftResult> {
  try {
    // Find form instance by secure token
    const formInstance = await prisma.formInstance.findUnique({
      where: { secureToken: token },
      select: {
        id: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!formInstance) {
      return { success: false, error: 'Form not found' };
    }

    // Check if form is expired
    if (formInstance.expiresAt < new Date()) {
      return { success: false, error: 'Form has expired' };
    }

    // Check if form is already submitted
    if (formInstance.status === 'COMPLETED') {
      return { success: false, error: 'Form has already been submitted' };
    }

    const now = new Date();

    // Clear draft data
    const response = await prisma.formResponse.upsert({
      where: {
        instanceId: formInstance.id,
      },
      update: {
        draftData: {},
        lastSavedAt: now,
      },
      create: {
        instanceId: formInstance.id,
        draftData: {},
        lastSavedAt: now,
      },
    });

    return {
      success: true,
      lastSavedAt: response.lastSavedAt,
    };

  } catch (error) {
    console.error('Error clearing draft:', error);
    return { success: false, error: 'Failed to clear draft' };
  }
}