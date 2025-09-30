'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TextField } from './fields/text-field';
import { NumberField } from './fields/number-field';
import { SelectField, SelectOption } from './fields/select-field';
import { ArrayField } from './fields/array-field';
import { validateFormData, ValidationError } from './validation';

export interface FormSchema {
  type: string;
  title?: string;
  description?: string;
  properties: Record<string, any>;
  required?: string[];
}

export interface UISchema {
  'ui:order'?: string[];
  [key: string]: any;
}

export interface FormRendererProps {
  schema: FormSchema;
  uiSchema?: UISchema;
  formData: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  onSubmit?: (data: Record<string, any>) => void;
  onError?: (errors: ValidationError[]) => void;
  onAutoSave?: (data: Record<string, any>) => Promise<void>;
  disabled?: boolean;
  showProgress?: boolean;
  submitLabel?: string;
  autoSaveDelay?: number;
}

export function FormRenderer({
  schema,
  uiSchema = {},
  formData,
  onChange,
  onSubmit,
  onError,
  onAutoSave,
  disabled = false,
  showProgress = false,
  submitLabel = 'Submit',
  autoSaveDelay = 2000,
}: FormRendererProps) {
  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedDataRef = useRef<string>('');

  // Validate form data in real-time and cache validation results
  const validation = validateFormData(schema, formData);

  // Auto-save effect
  useEffect(() => {
    if (!onAutoSave) return;

    const currentDataString = JSON.stringify(formData);

    // Don't auto-save if data hasn't changed
    if (currentDataString === lastSavedDataRef.current) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set saving status
    setSaveStatus('saving');

    // Debounce auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await onAutoSave(formData);
        lastSavedDataRef.current = currentDataString;
        setSaveStatus('saved');

        // Reset to idle after showing saved status
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, autoSaveDelay);

    // Cleanup timeout on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, onAutoSave, autoSaveDelay]);

  const handleFieldChange = useCallback((fieldPath: string, value: any) => {
    const newData = { ...formData };
    const pathParts = fieldPath.split('.');

    if (pathParts.length === 1) {
      newData[pathParts[0]] = value;
    } else {
      // Handle nested field changes
      const [parentField, childField] = pathParts;
      if (!newData[parentField]) {
        newData[parentField] = {};
      }
      newData[parentField] = { ...newData[parentField], [childField]: value };
    }

    onChange(newData);
  }, [formData, onChange]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.isValid && onError) {
      onError(validation.errors);
      return;
    }

    if (onSubmit) {
      onSubmit(formData);
    }
  }, [validation, formData, onSubmit, onError]);

  const getFieldValue = (fieldPath: string): any => {
    const pathParts = fieldPath.split('.');
    if (pathParts.length === 1) {
      return formData[pathParts[0]] || '';
    }
    const [parentField, childField] = pathParts;
    return formData[parentField]?.[childField] || '';
  };

  const renderField = (fieldName: string, fieldSchema: any, parentPath = ''): React.ReactNode => {
    const fieldPath = parentPath ? `${parentPath}.${fieldName}` : fieldName;
    const value = getFieldValue(fieldPath);
    const errors = validation.errors;
    const fieldUiSchema = uiSchema[fieldName] || {};

    switch (fieldSchema.type) {
      case 'string':
        if (fieldSchema.enum) {
          const options: SelectOption[] = fieldSchema.enum.map((value: string) => ({
            value,
            label: value.charAt(0).toUpperCase() + value.slice(1),
          }));

          return (
            <SelectField
              key={fieldPath}
              name={fieldPath}
              label={fieldSchema.title || fieldName}
              value={value}
              placeholder={`Select ${fieldSchema.title || fieldName}`}
              description={fieldSchema.description}
              required={schema.required?.includes(fieldName)}
              options={options}
              errors={errors}
              onChange={(newValue) => handleFieldChange(fieldPath, newValue)}
            />
          );
        }

        return (
          <TextField
            key={fieldPath}
            name={fieldPath}
            label={fieldSchema.title || fieldName}
            value={value}
            placeholder={fieldSchema.placeholder}
            description={fieldSchema.description}
            required={schema.required?.includes(fieldName)}
            type={fieldSchema.format === 'email' ? 'email' :
                  fieldSchema.format === 'date' ? 'date' :
                  fieldSchema.format === 'uri' ? 'url' : 'text'}
            multiline={fieldUiSchema['ui:widget'] === 'textarea'}
            rows={fieldUiSchema['ui:rows'] || 3}
            minLength={fieldSchema.minLength}
            maxLength={fieldSchema.maxLength}
            pattern={fieldSchema.pattern}
            errors={errors}
            onChange={(newValue) => handleFieldChange(fieldPath, newValue)}
          />
        );

      case 'number':
      case 'integer':
        return (
          <NumberField
            key={fieldPath}
            name={fieldPath}
            label={fieldSchema.title || fieldName}
            value={value}
            placeholder={fieldSchema.placeholder}
            description={fieldSchema.description}
            required={schema.required?.includes(fieldName)}
            min={fieldSchema.minimum}
            max={fieldSchema.maximum}
            step={fieldSchema.step || (fieldSchema.type === 'integer' ? 1 : 0.01)}
            errors={errors}
            onChange={(newValue) => handleFieldChange(fieldPath, newValue)}
          />
        );

      case 'array':
        return (
          <ArrayField
            key={fieldPath}
            name={fieldPath}
            label={fieldSchema.title || fieldName}
            value={Array.isArray(value) ? value : []}
            itemSchema={fieldSchema.items}
            required={schema.required?.includes(fieldName)}
            minItems={fieldSchema.minItems}
            maxItems={fieldSchema.maxItems}
            errors={errors}
            onChange={(newValue) => handleFieldChange(fieldPath, newValue)}
          />
        );

      case 'object':
        if (!fieldSchema.properties) return null;
        return (
          <div key={fieldPath} className="border border-gray-200 rounded-md p-4 mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {fieldSchema.title || fieldName}
            </h3>
            {Object.keys(fieldSchema.properties).map(nestedFieldName => {
              const nestedFieldSchema = fieldSchema.properties[nestedFieldName];
              return renderField(nestedFieldName, nestedFieldSchema, fieldName);
            })}
          </div>
        );

      default:
        return null;
    }
  };

  const getFieldOrder = (): string[] => {
    if (uiSchema['ui:order']) {
      return uiSchema['ui:order'];
    }
    return Object.keys(schema.properties || {});
  };

  const calculateProgress = (): number => {
    if (!showProgress || !schema.required) {
      return 0;
    }

    const requiredFields = schema.required;
    const completedFields = requiredFields.filter(fieldName => {
      const value = formData[fieldName];
      return value !== undefined && value !== null && value !== '';
    });

    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  const fieldOrder = getFieldOrder();
  const progress = calculateProgress();

  return (
    <div className="max-w-2xl mx-auto">
      {(schema.title || schema.description) && (
        <div className="mb-8">
          {schema.title && (
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {schema.title}
            </h1>
          )}
          {schema.description && (
            <p className="text-lg text-gray-600">
              {schema.description}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {showProgress && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">{progress}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {onAutoSave && (
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Auto-save</span>
              <div className="flex items-center space-x-2">
                {saveStatus === 'saving' && (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-300 border-t-blue-600"></div>
                    <span className="text-xs text-gray-500">Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600">Saved</span>
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-red-600">Save failed</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      <div className="space-y-4">
        {fieldOrder.map(fieldName => {
          const fieldSchema = schema.properties?.[fieldName];
          if (!fieldSchema) return null;
          return renderField(fieldName, fieldSchema);
        })}
      </div>

        {onSubmit && (
          <div className="pt-4">
            <button
              type="submit"
              disabled={disabled}
              className={`w-full py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                disabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {submitLabel}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}