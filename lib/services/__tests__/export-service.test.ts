import { describe, expect, it } from '@jest/globals';
import {
  generateSubmissionsCsv,
  generateSingleSubmissionCsv,
  generateFormFieldsSummary,
} from '../export-service';
import { SubmissionListItem } from '../submission-query-service';

const mockSubmissions: SubmissionListItem[] = [
  {
    id: 'sub-1',
    formInstanceId: 'form-1',
    clientEmail: 'john@example.com',
    clientName: 'John Doe',
    formTitle: 'Basic Client Intake',
    templateCategory: 'Immigration',
    submittedAt: new Date('2023-12-01T10:00:00Z'),
    data: {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+1 (555) 123-4567',
      dateOfBirth: '1985-06-15',
      address: {
        street: '123 Main St',
        city: 'Toronto',
        postalCode: 'M1M 1M1',
      },
      languages: ['English', 'French'],
      hasChildren: true,
    },
  },
  {
    id: 'sub-2',
    formInstanceId: 'form-2',
    clientEmail: 'jane@example.com',
    clientName: 'Jane Smith',
    formTitle: 'Express Entry Assessment',
    templateCategory: 'Express Entry',
    submittedAt: new Date('2023-12-02T14:30:00Z'),
    data: {
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      age: 28,
      maritalStatus: 'Single',
      education: 'Masters Degree',
      workExperience: 5,
      isMarried: false,
    },
  },
];

describe('Export Service', () => {
  describe('generateSubmissionsCsv', () => {
    it('should generate CSV with metadata and form data', () => {
      const result = generateSubmissionsCsv(mockSubmissions);

      expect(result.contentType).toBe('text/csv; charset=utf-8');
      expect(result.filename).toMatch(/submissions-\d{4}-\d{2}-\d{2}\.csv/);

      // Check that CSV contains headers and data
      const lines = result.content.split('\n');
      expect(lines.length).toBeGreaterThan(2); // Headers + at least 2 data rows

      // Check for metadata columns
      expect(result.content).toContain('Submission ID');
      expect(result.content).toContain('Client Name');
      expect(result.content).toContain('Client Email');
      expect(result.content).toContain('Form Title');
      expect(result.content).toContain('Template Category');

      // Check for form data columns
      expect(result.content).toContain('Full Name');
      expect(result.content).toContain('Email');
      expect(result.content).toContain('Address - Street');
      expect(result.content).toContain('Address - City');

      // Check for actual data
      expect(result.content).toContain('John Doe');
      expect(result.content).toContain('Jane Smith');
      expect(result.content).toContain('john@example.com');
      expect(result.content).toContain('Basic Client Intake');
    });

    it('should handle empty submissions array', () => {
      const result = generateSubmissionsCsv([]);

      expect(result.content).toBe('No submissions found');
      expect(result.filename).toBe('submissions-empty.csv');
      expect(result.contentType).toBe('text/csv');
    });

    it('should exclude metadata when option is false', () => {
      const result = generateSubmissionsCsv(mockSubmissions, {
        includeMetadata: false,
        includeFormData: true,
      });

      expect(result.content).not.toContain('Submission ID');
      expect(result.content).not.toContain('Client Name');
      expect(result.content).toContain('Full Name'); // Form data should be included
    });

    it('should exclude form data when option is false', () => {
      const result = generateSubmissionsCsv(mockSubmissions, {
        includeMetadata: true,
        includeFormData: false,
      });

      expect(result.content).toContain('Submission ID'); // Metadata should be included
      expect(result.content).not.toContain('Full Name'); // Form data should not be included
    });

    it('should use ISO date format when specified', () => {
      const result = generateSubmissionsCsv(mockSubmissions, {
        dateFormat: 'iso',
      });

      expect(result.content).toContain('2023-12-01T10:00:00.000Z');
      expect(result.content).toContain('2023-12-02T14:30:00.000Z');
    });

    it('should not flatten data when option is false', () => {
      const result = generateSubmissionsCsv(mockSubmissions, {
        flattenData: false,
      });

      expect(result.content).not.toContain('Address - Street');
      expect(result.content).toContain('Form Data'); // Should have JSON column instead
    });

    it('should handle boolean and array values correctly', () => {
      const result = generateSubmissionsCsv(mockSubmissions);

      expect(result.content).toContain('"Yes"'); // hasChildren: true
      expect(result.content).toContain('"English; French"'); // languages array
      // Note: isMarried: false appears only in submission 2 which has minimal data
    });
  });

  describe('generateSingleSubmissionCsv', () => {
    it('should generate CSV for single submission', () => {
      const submission = mockSubmissions[0];
      const result = generateSingleSubmissionCsv(submission);

      expect(result.contentType).toBe('text/csv; charset=utf-8');
      expect(result.filename).toMatch(/submission-John-Doe-\d{4}-\d{2}-\d{2}\.csv/);

      // Check for metadata (values are quoted)
      expect(result.content).toContain('"Submission ID","sub-1"');
      expect(result.content).toContain('"Client Name","John Doe"');
      expect(result.content).toContain('"Client Email","john@example.com"');

      // Check for form data (values are quoted)
      expect(result.content).toContain('"Full Name","John Doe"');
      expect(result.content).toContain('"Address - Street","123 Main St"');
      expect(result.content).toContain('"Has Children","Yes"');
      expect(result.content).toContain('"Languages","English; French"');
    });

    it('should exclude metadata when option is false', () => {
      const submission = mockSubmissions[0];
      const result = generateSingleSubmissionCsv(submission, {
        includeMetadata: false,
      });

      expect(result.content).not.toContain('Submission ID');
      expect(result.content).not.toContain('Client Name');
      expect(result.content).toContain('Full Name'); // Form data should be included
    });

    it('should exclude form data when option is false', () => {
      const submission = mockSubmissions[0];
      const result = generateSingleSubmissionCsv(submission, {
        includeFormData: false,
      });

      expect(result.content).toContain('Submission ID'); // Metadata should be included
      expect(result.content).not.toContain('Full Name'); // Form data should not be included
    });

    it('should use ISO date format when specified', () => {
      const submission = mockSubmissions[0];
      const result = generateSingleSubmissionCsv(submission, {
        dateFormat: 'iso',
      });

      expect(result.content).toContain('2023-12-01T10:00:00.000Z');
    });

    it('should handle special characters in client name for filename', () => {
      const submission = {
        ...mockSubmissions[0],
        clientName: 'John O\'Connor & Associates, Inc.',
      };

      const result = generateSingleSubmissionCsv(submission);

      expect(result.filename).toMatch(/submission-John-O-Connor---Associates--Inc--\d{4}-\d{2}-\d{2}\.csv/);
    });
  });

  describe('generateFormFieldsSummary', () => {
    it('should generate fields summary CSV', () => {
      const result = generateFormFieldsSummary(mockSubmissions);

      expect(result.contentType).toBe('text/csv; charset=utf-8');
      expect(result.filename).toMatch(/form-fields-summary-\d{4}-\d{2}-\d{2}\.csv/);

      // Check headers (values are quoted)
      expect(result.content).toContain('"Field Name","Response Count","Response Rate","Sample Values"');

      // Check field statistics (values are quoted)
      expect(result.content).toContain('"Full Name","2","100.0%"'); // Present in both submissions
      expect(result.content).toContain('"Age","1","50.0%"'); // Present in only one submission
      expect(result.content).toContain('"Address - Street","1","50.0%"'); // Nested field
    });

    it('should handle empty submissions array', () => {
      const result = generateFormFieldsSummary([]);

      expect(result.content).toBe('No submissions found');
      expect(result.filename).toBe('fields-summary-empty.csv');
      expect(result.contentType).toBe('text/csv');
    });

    it('should calculate response rates correctly', () => {
      const submissions = [
        {
          ...mockSubmissions[0],
          data: { name: 'Test 1', email: 'test1@example.com' },
        },
        {
          ...mockSubmissions[1],
          data: { name: 'Test 2' }, // Missing email
        },
        {
          ...mockSubmissions[0],
          data: { email: 'test3@example.com' }, // Missing name
        },
      ];

      const result = generateFormFieldsSummary(submissions);

      // Name appears in 2 out of 3 submissions = 66.7% (values are quoted)
      expect(result.content).toContain('"Name","2","66.7%"');

      // Email appears in 2 out of 3 submissions = 66.7% (values are quoted)
      expect(result.content).toContain('"Email","2","66.7%"');
    });

    it('should include sample values for short text', () => {
      const submissions = [
        {
          ...mockSubmissions[0],
          data: { status: 'Active', type: 'Premium' },
        },
        {
          ...mockSubmissions[1],
          data: { status: 'Inactive', type: 'Basic' },
        },
      ];

      const result = generateFormFieldsSummary(submissions);

      expect(result.content).toContain('"Status","2","100.0%"');
      expect(result.content).toContain('"Type","2","100.0%"');

      // Should include sample values (may vary in order)
      expect(result.content).toMatch(/Active|Inactive/);
      expect(result.content).toMatch(/Premium|Basic/);
    });

    it('should not include sample values for long text', () => {
      const longText = 'This is a very long text that should not be included as a sample value because it exceeds the length limit';

      const submissions = [
        {
          ...mockSubmissions[0],
          data: { description: longText },
        },
      ];

      const result = generateFormFieldsSummary(submissions);

      expect(result.content).toContain('"Description","1","100.0%","N/A"');
    });

    it('should limit sample values to 3 items', () => {
      const submissions = [
        { ...mockSubmissions[0], data: { status: 'A' } },
        { ...mockSubmissions[0], data: { status: 'B' } },
        { ...mockSubmissions[0], data: { status: 'C' } },
        { ...mockSubmissions[0], data: { status: 'D' } },
        { ...mockSubmissions[0], data: { status: 'E' } },
      ];

      const result = generateFormFieldsSummary(submissions);

      // Should have at most 3 sample values separated by semicolons
      const statusLine = result.content.split('\n').find(line => line.startsWith('Status'));
      const sampleValues = statusLine?.split(',')[3] || '';
      const valueCount = sampleValues.split(';').length;

      expect(valueCount).toBeLessThanOrEqual(3);
    });
  });
});