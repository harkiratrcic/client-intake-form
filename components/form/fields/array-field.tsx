'use client';

import React from 'react';
import { TextField } from './text-field';
import { NumberField } from './number-field';
import { SelectField, SelectOption } from './select-field';
import { ValidationError } from '../validation';

interface ArrayFieldProps {
  name: string;
  label: string;
  value: any[];
  itemSchema: any;
  required?: boolean;
  minItems?: number;
  maxItems?: number;
  errors?: ValidationError[];
  onChange: (value: any[]) => void;
  disabled?: boolean;
}

export function ArrayField({
  name,
  label,
  value = [],
  itemSchema,
  required = false,
  minItems,
  maxItems,
  errors = [],
  onChange,
  disabled = false,
}: ArrayFieldProps) {
  const handleAddItem = () => {
    const newItem: any = {};

    // Initialize with empty values based on schema
    if (itemSchema.type === 'object' && itemSchema.properties) {
      Object.keys(itemSchema.properties).forEach(key => {
        const prop = itemSchema.properties[key];
        if (prop.type === 'array') {
          newItem[key] = [];
        } else if (prop.type === 'object') {
          newItem[key] = {};
        } else if (prop.type === 'number' || prop.type === 'integer') {
          newItem[key] = '';
        } else {
          newItem[key] = '';
        }
      });
    }

    onChange([...value, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const handleItemChange = (index: number, fieldName: string, fieldValue: any) => {
    const newValue = [...value];
    newValue[index] = {
      ...newValue[index],
      [fieldName]: fieldValue,
    };
    onChange(newValue);
  };

  const renderItemField = (
    item: any,
    itemIndex: number,
    fieldName: string,
    fieldSchema: any
  ): React.ReactNode => {
    const fieldPath = `${name}[${itemIndex}].${fieldName}`;
    const fieldValue = item[fieldName] || '';
    const fieldErrors = errors.filter(e => e.path.startsWith(fieldPath));

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
              value={fieldValue}
              placeholder={`Select ${fieldSchema.title || fieldName}`}
              required={itemSchema.required?.includes(fieldName)}
              options={options}
              errors={fieldErrors}
              onChange={(newValue) => handleItemChange(itemIndex, fieldName, newValue)}
              disabled={disabled}
            />
          );
        }

        return (
          <TextField
            key={fieldPath}
            name={fieldPath}
            label={fieldSchema.title || fieldName}
            value={fieldValue}
            placeholder={fieldSchema.placeholder}
            type={
              fieldSchema.format === 'email' ? 'email' :
              fieldSchema.format === 'date' ? 'date' :
              fieldSchema.format === 'uri' ? 'url' : 'text'
            }
            required={itemSchema.required?.includes(fieldName)}
            minLength={fieldSchema.minLength}
            maxLength={fieldSchema.maxLength}
            pattern={fieldSchema.pattern}
            errors={fieldErrors}
            onChange={(newValue) => handleItemChange(itemIndex, fieldName, newValue)}
            disabled={disabled}
          />
        );

      case 'number':
      case 'integer':
        return (
          <NumberField
            key={fieldPath}
            name={fieldPath}
            label={fieldSchema.title || fieldName}
            value={fieldValue}
            placeholder={fieldSchema.placeholder}
            required={itemSchema.required?.includes(fieldName)}
            min={fieldSchema.minimum}
            max={fieldSchema.maximum}
            step={fieldSchema.step || (fieldSchema.type === 'integer' ? 1 : 0.01)}
            errors={fieldErrors}
            onChange={(newValue) => handleItemChange(itemIndex, fieldName, newValue)}
            disabled={disabled}
          />
        );

      default:
        return null;
    }
  };

  const canAddMore = !maxItems || value.length < maxItems;
  const canRemove = !minItems || value.length > minItems;
  const fieldError = errors.find(e => e.path === name);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {minItems && (
            <p className="text-xs text-gray-500 mt-1">
              Minimum {minItems} {minItems === 1 ? 'entry' : 'entries'} required
            </p>
          )}
        </div>
        {canAddMore && (
          <button
            type="button"
            onClick={handleAddItem}
            disabled={disabled}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add {label}
          </button>
        )}
      </div>

      {fieldError && (
        <p className="text-sm text-red-600">{fieldError.message}</p>
      )}

      {value.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">
            No entries yet. Click "Add {label}" to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {value.map((item, index) => (
            <div
              key={index}
              className="relative border border-gray-300 rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-medium text-gray-900">
                  {label} #{index + 1}
                </h4>
                {canRemove && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={disabled}
                    className="inline-flex items-center p-1 border border-transparent rounded-md text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {itemSchema.type === 'object' && itemSchema.properties && (
                <div className="space-y-3">
                  {Object.keys(itemSchema.properties).map(fieldName => {
                    const fieldSchema = itemSchema.properties[fieldName];
                    return renderItemField(item, index, fieldName, fieldSchema);
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
