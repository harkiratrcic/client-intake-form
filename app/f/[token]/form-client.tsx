'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FormRenderer } from '../../../components/form/form-renderer';
import { ValidationError } from '../../../components/form/validation';
import { useAutoSave } from '../../../hooks/use-auto-save';

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

interface Props {
  formInstance: FormInstance;
}

export function FormPageClient({ formInstance }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState(formInstance.formData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const isExpired = new Date(formInstance.expiresAt) < new Date();
  const isCompleted = formInstance.status === 'submitted';

  // Auto-save function
  const saveDraft = useCallback(async (data: Record<string, any>) => {
    const response = await fetch(`/api/forms/${formInstance.token}/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save draft');
    }
  }, [formInstance.token]);

  // Auto-save hook
  const autoSave = useAutoSave(formData, saveDraft, {
    delay: 2000,
    maxRetries: 3,
    enableLocalStorage: true,
    localStorageKey: `form-draft-${formInstance.token}`,
  });

  const handleFormChange = useCallback((data: Record<string, any>) => {
    setFormData(data);
  }, []);

  const handleFormSubmit = useCallback(async (data: Record<string, any>) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/forms/${formInstance.token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit form');
      }

      const result = await response.json();
      console.log('Form submitted successfully:', result.submissionId);

      // Redirect to success page
      router.push(`/f/${formInstance.token}/success`);
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  }, [formInstance.token, isSubmitting]);

  const handleFormError = useCallback((errors: ValidationError[]) => {
    console.log('Form validation errors:', errors);
    // Validation errors are already displayed by FormRenderer
  }, []);

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm rounded-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4">
              <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Submitted Successfully!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for completing the {formInstance.template.name}. Your information has been sent to {formInstance.owner.name}.
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">What happens next?</h3>
              <p className="text-sm text-gray-600">
                {formInstance.owner.name} will review your submission and contact you if additional information is needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isExpired || isCompleted) {
    const title = isExpired ? 'Form Expired' : 'Form Already Submitted';
    const message = isExpired
      ? 'This form has expired and can no longer be completed.'
      : 'This form has already been submitted and cannot be modified.';

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm rounded-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4">
                <svg className="w-16 h-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
              <p className="text-gray-600">{message}</p>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center mb-3">
                  <h3 className="text-lg font-medium text-gray-900">{formInstance.owner.name}</h3>
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    RCIC #{formInstance.owner.rcicNumber}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">
                  <a href={`mailto:${formInstance.owner.email}`} className="text-blue-600 hover:text-blue-800">
                    {formInstance.owner.email}
                  </a>
                </p>
                <p className="text-sm text-gray-500">
                  Please contact them directly if you need to submit new information or have questions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg">
          {/* Form Header */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {formInstance.template.name}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {formInstance.status}
                  </span>
                  <span>
                    Expires: {new Date(formInstance.expiresAt).toLocaleDateString()}
                  </span>
                  {/* Auto-save status */}
                  <div className="flex items-center space-x-2">
                    {autoSave.status === 'saving' && (
                      <div className="flex items-center text-yellow-600">
                        <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-xs">Saving...</span>
                      </div>
                    )}
                    {autoSave.status === 'saved' && autoSave.lastSaved && (
                      <div className="flex items-center text-green-600">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-xs">
                          Saved {new Date(autoSave.lastSaved).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    {autoSave.status === 'error' && autoSave.error && (
                      <div className="flex items-center text-red-600">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs">Save failed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center mb-1">
                  <h3 className="text-sm font-medium text-gray-900">{formInstance.owner.name}</h3>
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    RCIC #{formInstance.owner.rcicNumber}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{formInstance.owner.email}</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-6 py-6">
            {submitError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Submission Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{submitError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <FormRenderer
              schema={formInstance.template.schema}
              uiSchema={formInstance.template.uiSchema}
              formData={formData}
              onChange={handleFormChange}
              onSubmit={handleFormSubmit}
              onError={handleFormError}
              disabled={isSubmitting}
              showProgress={true}
              submitLabel={isSubmitting ? 'Submitting...' : 'Submit Form'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}