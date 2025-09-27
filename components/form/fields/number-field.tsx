import React from 'react';
import { ValidationError } from '../validation';

export interface NumberFieldProps {
  label: string;
  name: string;
  value: number | string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  errors?: ValidationError[];
  onChange: (value: number | string) => void;
  onBlur?: () => void;
}

export function NumberField({
  label,
  name,
  value,
  placeholder,
  description,
  required = false,
  min,
  max,
  step,
  errors = [],
  onChange,
  onBlur,
}: NumberFieldProps) {
  const fieldErrors = errors.filter(error => error.path === name);
  const hasError = fieldErrors.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange('');
    } else {
      const numValue = parseFloat(val);
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
    }
  };

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
        type="number"
        value={value}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        className={`form-input w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          hasError
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500'
        }`}
        onChange={handleChange}
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