'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api/authenticated-fetch';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  schema: any;
  isActive: boolean;
}

interface FormCreatorProps {
  initialTemplates?: Template[];
  onFormCreated?: (formData: any) => void;
  isLoading?: boolean;
  error?: string;
}

interface FormData {
  templateId: string;
  clientEmail: string;
  clientName: string;
  expiryDays: number;
  personalMessage: string;
}

export function FormCreator({
  initialTemplates = [],
  onFormCreated,
  isLoading: externalLoading = false,
  error: externalError
}: FormCreatorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(externalError || null);
  const [formData, setFormData] = useState<FormData>({
    templateId: '',
    clientEmail: '',
    clientName: '',
    expiryDays: 14,
    personalMessage: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Load templates if not provided
  useEffect(() => {
    if (initialTemplates.length === 0) {
      loadTemplates();
    }
  }, [initialTemplates.length]);

  // Pre-fill form data from URL parameters
  useEffect(() => {
    const clientName = searchParams.get('clientName');
    const clientEmail = searchParams.get('clientEmail');

    if (clientName || clientEmail) {
      setFormData(prev => ({
        ...prev,
        clientName: clientName || '',
        clientEmail: clientEmail || '',
      }));
    }
  }, [searchParams]);

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    setError(null);

    try {
      const response = await api.get('/api/templates');
      if (!response.ok) {
        throw new Error('Failed to load templates');
      }
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.templateId) {
      errors.templateId = 'Please select a template';
    }

    if (!formData.clientEmail.trim()) {
      errors.clientEmail = 'Client email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      errors.clientEmail = 'Please enter a valid email address';
    }

    if (!formData.clientName.trim()) {
      errors.clientName = 'Client name is required';
    }

    if (formData.expiryDays < 1 || formData.expiryDays > 90) {
      errors.expiryDays = 'Expiry days must be between 1 and 90';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.post('/api/forms', formData);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create form');
      }

      if (onFormCreated) {
        onFormCreated(data);
      } else {
        // Default behavior: redirect to forms list
        router.push('/dashboard/forms');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const selectedTemplate = templates.find(t => t.id === formData.templateId);
  const isLoading = externalLoading || isLoadingTemplates || isSubmitting;

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Selection */}
        <div>
          <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-2">
            Select Template *
          </label>
          <select
            id="template"
            value={formData.templateId}
            onChange={(e) => handleInputChange('templateId', e.target.value)}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              fieldErrors.templateId ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isLoading}
          >
            <option value="">Choose a template...</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} {template.category && `(${template.category})`}
              </option>
            ))}
          </select>
          {fieldErrors.templateId && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.templateId}</p>
          )}
          {selectedTemplate && (
            <p className="mt-1 text-sm text-gray-500">{selectedTemplate.description}</p>
          )}
        </div>

        {/* Client Information */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
              Client Name *
            </label>
            <input
              type="text"
              id="clientName"
              value={formData.clientName}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                fieldErrors.clientName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter client's full name"
              disabled={isLoading}
            />
            {fieldErrors.clientName && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.clientName}</p>
            )}
          </div>

          <div>
            <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Client Email *
            </label>
            <input
              type="email"
              id="clientEmail"
              value={formData.clientEmail}
              onChange={(e) => handleInputChange('clientEmail', e.target.value.toLowerCase())}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                fieldErrors.clientEmail ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="client@example.com"
              disabled={isLoading}
            />
            {fieldErrors.clientEmail && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.clientEmail}</p>
            )}
          </div>
        </div>

        {/* Form Settings */}
        <div>
          <label htmlFor="expiryDays" className="block text-sm font-medium text-gray-700 mb-1">
            Expiry Period
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              id="expiryDays"
              min="1"
              max="90"
              value={formData.expiryDays}
              onChange={(e) => handleInputChange('expiryDays', parseInt(e.target.value, 10))}
              className={`block w-20 px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                fieldErrors.expiryDays ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            <span className="text-sm text-gray-500">days from now</span>
          </div>
          {fieldErrors.expiryDays && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.expiryDays}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Client will have {formData.expiryDays} days to complete the form after receiving it.
          </p>
        </div>

        {/* Personal Message */}
        <div>
          <label htmlFor="personalMessage" className="block text-sm font-medium text-gray-700 mb-1">
            Personal Message
          </label>
          <textarea
            id="personalMessage"
            rows={4}
            value={formData.personalMessage}
            onChange={(e) => handleInputChange('personalMessage', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Optional: Add a personal message for your client..."
            disabled={isLoading}
          />
          <p className="mt-1 text-sm text-gray-500">
            This message will be included in the email sent to your client.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Creating Form</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Preview */}
        {selectedTemplate && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Form Preview</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p><strong>Template:</strong> {selectedTemplate.name}</p>
                  <p><strong>Category:</strong> {selectedTemplate.category}</p>
                  <p><strong>Description:</strong> {selectedTemplate.description}</p>
                  {formData.clientName && (
                    <p className="mt-2"><strong>Will be sent to:</strong> {formData.clientName} ({formData.clientEmail})</p>
                  )}
                  <p className="mt-2"><strong>Expires:</strong> {new Date(Date.now() + formData.expiryDays * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/forms')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Form...
              </div>
            ) : (
              'Create Form & Send to Client'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}