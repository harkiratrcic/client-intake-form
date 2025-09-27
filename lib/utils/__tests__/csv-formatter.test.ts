import { describe, expect, it } from '@jest/globals';
import {
  formatCellValue,
  formatDateForCsv,
  escapeCsvValue,
  flattenNestedData,
  generateColumnHeaders,
  formatFieldName,
} from '../csv-formatter';

describe('CSV Formatter', () => {
  describe('formatCellValue', () => {
    it('should handle null and undefined values', () => {
      expect(formatCellValue(null)).toBe('');
      expect(formatCellValue(undefined)).toBe('');
    });

    it('should format boolean values', () => {
      expect(formatCellValue(true)).toBe('Yes');
      expect(formatCellValue(false)).toBe('No');
    });

    it('should format array values', () => {
      expect(formatCellValue(['apple', 'banana', 'cherry'])).toBe('apple; banana; cherry');
      expect(formatCellValue([])).toBe('');
    });

    it('should format object values as JSON', () => {
      const obj = { name: 'John', age: 30 };
      expect(formatCellValue(obj)).toBe(JSON.stringify(obj));
    });

    it('should clean up string values', () => {
      expect(formatCellValue('  Hello\nWorld\r\n  ')).toBe('Hello World');
      expect(formatCellValue('Multiple   spaces')).toBe('Multiple spaces');
    });

    it('should handle numeric values', () => {
      expect(formatCellValue(123)).toBe('123');
      expect(formatCellValue(123.45)).toBe('123.45');
    });
  });

  describe('formatDateForCsv', () => {
    it('should format dates correctly', () => {
      const date = new Date('2023-12-01T14:30:00Z');
      const formatted = formatDateForCsv(date);

      // The exact format will depend on locale, but should contain the date parts
      expect(formatted).toMatch(/Dec/);
      expect(formatted).toMatch(/1/);
      expect(formatted).toMatch(/2023/);
    });
  });

  describe('escapeCsvValue', () => {
    it('should escape values with commas', () => {
      expect(escapeCsvValue('Hello, World')).toBe('"Hello, World"');
    });

    it('should escape values with double quotes', () => {
      expect(escapeCsvValue('Say "Hello"')).toBe('"Say ""Hello"""');
    });

    it('should escape values with newlines', () => {
      expect(escapeCsvValue('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
    });

    it('should not escape simple values', () => {
      expect(escapeCsvValue('Simple text')).toBe('Simple text');
    });
  });

  describe('flattenNestedData', () => {
    it('should flatten nested objects', () => {
      const data = {
        name: 'John',
        address: {
          street: '123 Main St',
          city: 'Toronto',
          postal: {
            code: 'M1M1M1',
            plus4: '1234',
          },
        },
        age: 30,
      };

      const result = flattenNestedData(data);

      expect(result).toEqual({
        name: 'John',
        'address.street': '123 Main St',
        'address.city': 'Toronto',
        'address.postal.code': 'M1M1M1',
        'address.postal.plus4': '1234',
        age: '30',
      });
    });

    it('should handle arrays without flattening', () => {
      const data = {
        name: 'John',
        hobbies: ['reading', 'swimming'],
        scores: [85, 92, 78],
      };

      const result = flattenNestedData(data);

      expect(result).toEqual({
        name: 'John',
        hobbies: 'reading; swimming',
        scores: '85; 92; 78',
      });
    });

    it('should handle dates without flattening', () => {
      const date = new Date('2023-12-01');
      const data = {
        name: 'John',
        birthDate: date,
      };

      const result = flattenNestedData(data);

      expect(result).toEqual({
        name: 'John',
        birthDate: date.toString(),
      });
    });

    it('should use prefix correctly', () => {
      const data = {
        name: 'John',
        contact: {
          email: 'john@example.com',
        },
      };

      const result = flattenNestedData(data, 'user');

      expect(result).toEqual({
        'user.name': 'John',
        'user.contact.email': 'john@example.com',
      });
    });
  });

  describe('generateColumnHeaders', () => {
    it('should generate headers from multiple objects', () => {
      const data = [
        { name: 'John', age: 30, address: { city: 'Toronto' } },
        { name: 'Jane', email: 'jane@example.com', address: { street: '456 Oak St' } },
      ];

      const headers = generateColumnHeaders(data);

      expect(headers).toEqual([
        'address.city',
        'address.street',
        'age',
        'email',
        'name',
      ]);
    });

    it('should handle empty array', () => {
      const headers = generateColumnHeaders([]);
      expect(headers).toEqual([]);
    });

    it('should sort headers alphabetically', () => {
      const data = [
        { zebra: 'Z', alpha: 'A', beta: 'B' },
      ];

      const headers = generateColumnHeaders(data);

      expect(headers).toEqual(['alpha', 'beta', 'zebra']);
    });
  });

  describe('formatFieldName', () => {
    it('should format camelCase field names', () => {
      expect(formatFieldName('firstName')).toBe('First Name');
      expect(formatFieldName('dateOfBirth')).toBe('Date Of Birth');
    });

    it('should format nested field names', () => {
      expect(formatFieldName('address.street')).toBe('Address - Street');
      expect(formatFieldName('contact.phone.mobile')).toBe('Contact - Phone - Mobile');
    });

    it('should handle single words', () => {
      expect(formatFieldName('name')).toBe('Name');
      expect(formatFieldName('email')).toBe('Email');
    });

    it('should handle already formatted names', () => {
      expect(formatFieldName('Full Name')).toBe('Full Name');
    });

    it('should handle names with numbers', () => {
      expect(formatFieldName('address2')).toBe('Address2');
      expect(formatFieldName('phone1Number')).toBe('Phone1 Number');
    });

    it('should clean up multiple spaces', () => {
      expect(formatFieldName('very   spaced    field')).toBe('Very Spaced Field');
    });

    it('should handle empty strings', () => {
      expect(formatFieldName('')).toBe('');
    });
  });
});