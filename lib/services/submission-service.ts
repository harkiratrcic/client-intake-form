import { prisma } from '../prisma';

export interface SubmissionResult {
  success: boolean;
  submissionId?: string;
  submittedAt?: Date;
  error?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidateSubmissionResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate form submission against schema
 */
export function validateSubmission(
  data: any,
  schema: any
): ValidateSubmissionResult {
  const errors: ValidationError[] = [];

  if (!schema || typeof schema !== 'object') {
    return { isValid: false, errors: [{ field: 'schema', message: 'Invalid schema' }] };
  }

  // Validate required fields
  if (schema.required && Array.isArray(schema.required)) {
    for (const requiredField of schema.required) {
      if (!data || data[requiredField] === undefined || data[requiredField] === null || data[requiredField] === '') {
        errors.push({
          field: requiredField,
          message: `${requiredField} is required`,
        });
      }
    }
  }

  // Validate field types based on schema properties
  if (schema.properties && typeof schema.properties === 'object') {
    for (const [fieldName, fieldSchema] of Object.entries(schema.properties as Record<string, any>)) {
      const fieldValue = data?.[fieldName];

      if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
        // Type validation
        switch (fieldSchema.type) {
          case 'string':
            if (typeof fieldValue !== 'string') {
              errors.push({
                field: fieldName,
                message: `${fieldName} must be a string`,
              });
            } else {
              // String length validation
              if (fieldSchema.minLength && fieldValue.length < fieldSchema.minLength) {
                errors.push({
                  field: fieldName,
                  message: `${fieldName} must be at least ${fieldSchema.minLength} characters`,
                });
              }
              if (fieldSchema.maxLength && fieldValue.length > fieldSchema.maxLength) {
                errors.push({
                  field: fieldName,
                  message: `${fieldName} must be no more than ${fieldSchema.maxLength} characters`,
                });
              }
              // Pattern validation
              if (fieldSchema.pattern) {
                const regex = new RegExp(fieldSchema.pattern);
                if (!regex.test(fieldValue)) {
                  errors.push({
                    field: fieldName,
                    message: fieldSchema.patternMessage || `${fieldName} format is invalid`,
                  });
                }
              }
            }
            break;

          case 'number':
          case 'integer':
            const numValue = Number(fieldValue);
            if (isNaN(numValue) || (fieldSchema.type === 'integer' && !Number.isInteger(numValue))) {
              errors.push({
                field: fieldName,
                message: `${fieldName} must be a valid ${fieldSchema.type}`,
              });
            } else {
              // Number range validation
              if (fieldSchema.minimum && numValue < fieldSchema.minimum) {
                errors.push({
                  field: fieldName,
                  message: `${fieldName} must be at least ${fieldSchema.minimum}`,
                });
              }
              if (fieldSchema.maximum && numValue > fieldSchema.maximum) {
                errors.push({
                  field: fieldName,
                  message: `${fieldName} must be no more than ${fieldSchema.maximum}`,
                });
              }
            }
            break;

          case 'boolean':
            if (typeof fieldValue !== 'boolean') {
              errors.push({
                field: fieldName,
                message: `${fieldName} must be true or false`,
              });
            }
            break;

          case 'array':
            if (!Array.isArray(fieldValue)) {
              errors.push({
                field: fieldName,
                message: `${fieldName} must be an array`,
              });
            } else {
              // Array length validation
              if (fieldSchema.minItems && fieldValue.length < fieldSchema.minItems) {
                errors.push({
                  field: fieldName,
                  message: `${fieldName} must have at least ${fieldSchema.minItems} items`,
                });
              }
              if (fieldSchema.maxItems && fieldValue.length > fieldSchema.maxItems) {
                errors.push({
                  field: fieldName,
                  message: `${fieldName} must have no more than ${fieldSchema.maxItems} items`,
                });
              }
            }
            break;
        }

        // Enum validation
        if (fieldSchema.enum && Array.isArray(fieldSchema.enum)) {
          if (!fieldSchema.enum.includes(fieldValue)) {
            errors.push({
              field: fieldName,
              message: `${fieldName} must be one of: ${fieldSchema.enum.join(', ')}`,
            });
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Submit form data and finalize submission
 */
export async function submitForm(token: string, submissionData: any): Promise<SubmissionResult> {
  try {
    // Find form instance by secure token
    const formInstance = await prisma.formInstance.findUnique({
      where: { secureToken: token },
      include: {
        template: {
          select: {
            schema: true,
          },
        },
        response: {
          select: {
            id: true,
            draftData: true,
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

    // Validate submission data against schema
    const validation = validateSubmission(submissionData, formInstance.template.schema);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.map(e => `${e.field}: ${e.message}`).join(', ')}`,
      };
    }

    const now = new Date();
    const submissionId = `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Update or create form response with final submission data
    const response = await prisma.formResponse.upsert({
      where: {
        instanceId: formInstance.id,
      },
      update: {
        submittedData: submissionData,
        submittedAt: now,
        submissionId,
        draftData: {}, // Clear draft data after submission
      },
      create: {
        instanceId: formInstance.id,
        submittedData: submissionData,
        submittedAt: now,
        submissionId,
        draftData: {},
      },
    });

    // Update form instance status to completed
    await prisma.formInstance.update({
      where: { id: formInstance.id },
      data: {
        status: 'COMPLETED',
        submittedAt: now,
      },
    });

    // TODO: Queue confirmation emails (will be implemented in email service)

    return {
      success: true,
      submissionId: response.submissionId || submissionId,
      submittedAt: now,
    };

  } catch (error) {
    console.error('Error submitting form:', error);
    return { success: false, error: 'Failed to submit form' };
  }
}

/**
 * Get submission details
 */
export async function getSubmission(token: string) {
  try {
    const formInstance = await prisma.formInstance.findUnique({
      where: { secureToken: token },
      include: {
        response: {
          select: {
            submittedData: true,
            submittedAt: true,
            submissionId: true,
          },
        },
        template: {
          select: {
            name: true,
          },
        },
        owner: {
          select: {
            name: true,
            email: true,
            rcicNumber: true,
          },
        },
      },
    });

    if (!formInstance) {
      return { error: 'Form not found' };
    }

    if (formInstance.status !== 'COMPLETED' || !formInstance.response?.submittedData) {
      return { error: 'Form has not been submitted' };
    }

    return {
      submissionId: formInstance.response.submissionId,
      submittedAt: formInstance.response.submittedAt,
      submittedData: formInstance.response.submittedData,
      template: formInstance.template,
      owner: formInstance.owner,
    };

  } catch (error) {
    console.error('Error retrieving submission:', error);
    return { error: 'Failed to retrieve submission' };
  }
}