import React from 'react';
import { ValidationError } from '../validation';

export interface TextFieldProps {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'tel' | 'url' | 'password';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  errors?: ValidationError[];
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export function TextField({
  label,
  name,
  value,
  placeholder,
  description,
  required = false,
  type = 'text',
  minLength,
  maxLength,
  pattern,
  errors = [],
  onChange,
  onBlur,
}: TextFieldProps) {
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

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
        className={`form-input w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          hasError
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500'
        }`}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-describedby={hasError ? `${name}-error` : undefined}
        aria-invalid={hasError}
      />

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