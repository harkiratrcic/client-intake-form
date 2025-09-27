/**
 * CSV Formatter Utility
 * Handles special characters, nested data, and formatting for CSV export
 */

export function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value.join('; ');
  }

  if (value instanceof Date) {
    return value.toString();
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  if (typeof value === 'string') {
    // Handle special characters and formatting
    return value
      .replace(/\r?\n/g, ' ') // Replace line breaks with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  return String(value);
}

export function formatDateForCsv(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function escapeCsvValue(value: string): string {
  // If value contains comma, double quote, or newline, wrap in double quotes
  // and escape any existing double quotes by doubling them
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function flattenNestedData(data: Record<string, any>, prefix = ''): Record<string, string> {
  const flattened: Record<string, string> = {};

  Object.keys(data).forEach(key => {
    const value = data[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // Recursively flatten nested objects
      Object.assign(flattened, flattenNestedData(value, fullKey));
    } else {
      flattened[fullKey] = formatCellValue(value);
    }
  });

  return flattened;
}

export function generateColumnHeaders(data: Record<string, any>[]): string[] {
  const allKeys = new Set<string>();

  data.forEach(item => {
    const flattened = flattenNestedData(item);
    Object.keys(flattened).forEach(key => allKeys.add(key));
  });

  return Array.from(allKeys).sort();
}

export function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/\./g, ' - ') // Replace dots with dashes for nested fields
    .replace(/\b\w/g, char => char.toUpperCase()) // Capitalize first letter of each word
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}