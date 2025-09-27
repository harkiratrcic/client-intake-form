import { describe, expect, it } from '@jest/globals';
import { validateFormData, ValidationError } from '../validation';

describe('Form Validation', () => {
  const schema = {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        title: 'Name',
        minLength: 2,
        maxLength: 50,
      },
      email: {
        type: 'string',
        title: 'Email',
        format: 'email',
      },
      age: {
        type: 'number',
        title: 'Age',
        minimum: 18,
        maximum: 120,
      },
      website: {
        type: 'string',
        title: 'Website',
        format: 'uri',
      },
      status: {
        type: 'string',
        title: 'Status',
        enum: ['active', 'inactive', 'pending'],
      },
      profile: {
        type: 'object',
        title: 'Profile',
        properties: {
          bio: {
            type: 'string',
            title: 'Biography',
            maxLength: 500,
          },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string', title: 'Street' },
              city: { type: 'string', title: 'City' },
            },
            required: ['street'],
          },
        },
        required: ['bio'],
      },
    },
    required: ['name', 'email', 'age'],
  };

  describe('validateFormData', () => {
    it('should validate correct data without errors', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        website: 'https://example.com',
        status: 'active',
        profile: {
          bio: 'A software developer',
          address: {
            street: '123 Main St',
            city: 'Toronto',
          },
        },
      };

      const result = validateFormData(schema, validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidData = {
        email: 'john@example.com',
        // name missing
        // age missing
      };

      const result = validateFormData(schema, invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);

      const errorPaths = result.errors.map(err => err.path);
      expect(errorPaths).toContain('name');
      expect(errorPaths).toContain('age');

      const nameError = result.errors.find(err => err.path === 'name');
      expect(nameError?.message).toContain('required');
    });

    it('should validate string length constraints', () => {
      const invalidData = {
        name: 'J', // Too short
        email: 'john@example.com',
        age: 30,
      };

      const result = validateFormData(schema, invalidData);

      expect(result.isValid).toBe(false);

      const nameError = result.errors.find(err => err.path === 'name');
      expect(nameError?.message).toContain('at least 2 characters');
      expect(nameError?.constraint).toBe(2);
    });

    it('should validate email format', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 30,
      };

      const result = validateFormData(schema, invalidData);

      expect(result.isValid).toBe(false);

      const emailError = result.errors.find(err => err.path === 'email');
      expect(emailError?.message).toContain('valid email');
    });

    it('should validate number ranges', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 15, // Too young
      };

      const result = validateFormData(schema, invalidData);

      expect(result.isValid).toBe(false);

      const ageError = result.errors.find(err => err.path === 'age');
      expect(ageError?.message).toContain('at least 18');
      expect(ageError?.constraint).toBe(18);
    });

    it('should validate enum values', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        status: 'unknown', // Invalid enum value
      };

      const result = validateFormData(schema, invalidData);

      expect(result.isValid).toBe(false);

      const statusError = result.errors.find(err => err.path === 'status');
      expect(statusError?.message).toContain('valid option');
      expect(statusError?.allowedValues).toEqual(['active', 'inactive', 'pending']);
    });

    it('should validate URI format', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        website: 'not-a-url',
      };

      const result = validateFormData(schema, invalidData);

      expect(result.isValid).toBe(false);

      const websiteError = result.errors.find(err => err.path === 'website');
      expect(websiteError?.message).toContain('valid URL');
    });

    it('should validate nested object properties', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        profile: {
          // bio missing (required)
          address: {
            // street missing (required)
            city: 'Toronto',
          },
        },
      };

      const result = validateFormData(schema, invalidData);

      expect(result.isValid).toBe(false);

      const errorPaths = result.errors.map(err => err.path);
      expect(errorPaths).toContain('profile.bio');
      expect(errorPaths).toContain('profile.address.street');
    });

    it('should validate string max length in nested objects', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        profile: {
          bio: 'A'.repeat(600), // Too long (max 500)
          address: {
            street: '123 Main St',
          },
        },
      };

      const result = validateFormData(schema, invalidData);

      expect(result.isValid).toBe(false);

      const bioError = result.errors.find(err => err.path === 'profile.bio');
      expect(bioError?.message).toContain('no more than 500 characters');
      expect(bioError?.constraint).toBe(500);
    });

    it('should handle empty data', () => {
      const result = validateFormData(schema, {});

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3); // name, email, age all required
    });

    it('should handle null and undefined values', () => {
      const invalidData = {
        name: null,
        email: undefined,
        age: 30,
      };

      const result = validateFormData(schema, invalidData);

      expect(result.isValid).toBe(false);

      const errorPaths = result.errors.map(err => err.path);
      expect(errorPaths).toContain('name');
      expect(errorPaths).toContain('email');
    });

    it('should provide user-friendly error messages', () => {
      const invalidData = {
        name: 'A', // Too short
        email: 'invalid-email',
        age: 200, // Too old
      };

      const result = validateFormData(schema, invalidData);

      const messages = result.errors.map(err => err.message);

      // Should have user-friendly messages, not technical ones
      expect(messages.some(msg => msg.includes('Name must be at least'))).toBe(true);
      expect(messages.some(msg => msg.includes('Please enter a valid email'))).toBe(true);
      expect(messages.some(msg => msg.includes('Age must be no more than'))).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with all properties', () => {
      const error = new ValidationError(
        'name',
        'Name is required',
        'required',
        undefined,
        ['option1', 'option2']
      );

      expect(error.path).toBe('name');
      expect(error.message).toBe('Name is required');
      expect(error.type).toBe('required');
      expect(error.constraint).toBeUndefined();
      expect(error.allowedValues).toEqual(['option1', 'option2']);
    });
  });
});