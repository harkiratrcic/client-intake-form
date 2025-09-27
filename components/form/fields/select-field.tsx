import React from 'react';
import { ValidationError } from '../validation';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  options: SelectOption[];
  errors?: ValidationError[];
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export function SelectField({
  label,
  name,
  value,
  placeholder = 'Please select...',
  description,
  required = false,
  options,
  errors = [],
  onChange,
  onBlur,
}: SelectFieldProps) {
  const fieldErrors = errors.filter(error => error.path === name);
  const hasError = fieldErrors.length > 0;

  return (
    <div className="form-field">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {description && (
        <p className="form-description text-gray-600 text-sm mb-2">
          {description}
        </p>
      )}

      <select
        id={name}
        name={name}
        value={value}
        required={required}
        className={`form-select w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          hasError
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500'
        }`}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-describedby={hasError ? `${name}-error` : undefined}
        aria-invalid={hasError}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {hasError && (
        <div id={`${name}-error`} className="mt-1">
          {fieldErrors.map((error, index) => (
            <p key={index} className="text-red-600 text-sm">
              {error.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}