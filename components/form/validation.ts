export class ValidationError {
  constructor(
    public path: string,
    public message: string,
    public type: string,
    public constraint?: number | string,
    public allowedValues?: string[]
  ) {}
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export function validateFormData(schema: any, data: any): ValidationResult {
  const errors: ValidationError[] = [];

  function validateValue(
    value: any,
    fieldSchema: any,
    path: string,
    fieldTitle?: string
  ): void {
    const title = fieldTitle || fieldSchema.title || path;

    // Check required fields
    if (value === null || value === undefined || value === '') {
      errors.push(new ValidationError(
        path,
        `${title} is required`,
        'required'
      ));
      return;
    }

    // Type validation
    switch (fieldSchema.type) {
      case 'string':
        validateString(value, fieldSchema, path, title);
        break;
      case 'number':
        validateNumber(value, fieldSchema, path, title);
        break;
      case 'object':
        validateObject(value, fieldSchema, path, title);
        break;
    }
  }

  function validateString(
    value: any,
    fieldSchema: any,
    path: string,
    title: string
  ): void {
    if (typeof value !== 'string') {
      errors.push(new ValidationError(
        path,
        `${title} must be a text value`,
        'type'
      ));
      return;
    }

    // Format validation
    if (fieldSchema.format) {
      switch (fieldSchema.format) {
        case 'email':
          if (!isValidEmail(value)) {
            errors.push(new ValidationError(
              path,
              `Please enter a valid email address`,
              'format'
            ));
          }
          break;
        case 'uri':
          if (!isValidUrl(value)) {
            errors.push(new ValidationError(
              path,
              `Please enter a valid URL`,
              'format'
            ));
          }
          break;
      }
    }

    // Length validation
    if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
      errors.push(new ValidationError(
        path,
        `${title} must be at least ${fieldSchema.minLength} characters long`,
        'minLength',
        fieldSchema.minLength
      ));
    }

    if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
      errors.push(new ValidationError(
        path,
        `${title} must be no more than ${fieldSchema.maxLength} characters long`,
        'maxLength',
        fieldSchema.maxLength
      ));
    }

    // Pattern validation
    if (fieldSchema.pattern) {
      const regex = new RegExp(fieldSchema.pattern);
      if (!regex.test(value)) {
        errors.push(new ValidationError(
          path,
          `${title} format is invalid`,
          'pattern',
          fieldSchema.pattern
        ));
      }
    }

    // Enum validation
    if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
      errors.push(new ValidationError(
        path,
        `Please select a valid option for ${title}`,
        'enum',
        undefined,
        fieldSchema.enum
      ));
    }
  }

  function validateNumber(
    value: any,
    fieldSchema: any,
    path: string,
    title: string
  ): void {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      errors.push(new ValidationError(
        path,
        `${title} must be a valid number`,
        'type'
      ));
      return;
    }

    // Range validation
    if (fieldSchema.minimum !== undefined && numValue < fieldSchema.minimum) {
      errors.push(new ValidationError(
        path,
        `${title} must be at least ${fieldSchema.minimum}`,
        'minimum',
        fieldSchema.minimum
      ));
    }

    if (fieldSchema.maximum !== undefined && numValue > fieldSchema.maximum) {
      errors.push(new ValidationError(
        path,
        `${title} must be no more than ${fieldSchema.maximum}`,
        'maximum',
        fieldSchema.maximum
      ));
    }
  }

  function validateObject(
    value: any,
    fieldSchema: any,
    path: string,
    title: string
  ): void {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push(new ValidationError(
        path,
        `${title} must be a valid object`,
        'type'
      ));
      return;
    }

    // Validate required fields in nested object
    if (fieldSchema.required) {
      for (const requiredField of fieldSchema.required) {
        const nestedPath = `${path}.${requiredField}`;
        const nestedSchema = fieldSchema.properties?.[requiredField];
        const nestedValue = value[requiredField];

        if (!nestedSchema) continue;

        if (nestedValue === null || nestedValue === undefined || nestedValue === '') {
          errors.push(new ValidationError(
            nestedPath,
            `${nestedSchema.title || requiredField} is required`,
            'required'
          ));
        }
      }
    }

    // Validate all properties in nested object
    if (fieldSchema.properties) {
      for (const [propName, propSchema] of Object.entries(fieldSchema.properties)) {
        const propValue = value[propName];
        const propPath = `${path}.${propName}`;

        // Skip validation for undefined optional fields
        if (propValue === undefined && (!fieldSchema.required || !fieldSchema.required.includes(propName))) {
          continue;
        }

        if (propValue !== undefined && propValue !== null && propValue !== '') {
          validateValue(propValue, propSchema, propPath, (propSchema as any)?.title);
        }
      }
    }
  }

  // Main validation logic
  if (schema.properties) {
    // Validate required fields
    if (schema.required) {
      for (const requiredField of schema.required) {
        const fieldSchema = schema.properties[requiredField];
        const value = data[requiredField];

        if (!fieldSchema) continue;

        if (value === null || value === undefined || value === '') {
          errors.push(new ValidationError(
            requiredField,
            `${fieldSchema.title || requiredField} is required`,
            'required'
          ));
        }
      }
    }

    // Validate all provided data
    for (const [fieldName, fieldValue] of Object.entries(data || {})) {
      const fieldSchema = schema.properties[fieldName];
      if (!fieldSchema) continue;

      // Skip validation for empty optional fields
      if ((fieldValue === undefined || fieldValue === null || fieldValue === '') &&
          (!schema.required || !schema.required.includes(fieldName))) {
        continue;
      }

      if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
        validateValue(fieldValue, fieldSchema, fieldName, fieldSchema.title);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}