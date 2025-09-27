import { stringify } from 'csv-stringify/sync';
import { SubmissionListItem } from './submission-query-service';
import {
  formatCellValue,
  formatDateForCsv,
  flattenNestedData,
  generateColumnHeaders,
  formatFieldName,
} from '../utils/csv-formatter';

export interface ExportOptions {
  includeMetadata?: boolean;
  includeFormData?: boolean;
  dateFormat?: 'iso' | 'localized';
  flattenData?: boolean;
}

export interface CsvExportResult {
  content: string;
  filename: string;
  contentType: string;
}

export function generateSubmissionsCsv(
  submissions: SubmissionListItem[],
  options: ExportOptions = {}
): CsvExportResult {
  const {
    includeMetadata = true,
    includeFormData = true,
    dateFormat = 'localized',
    flattenData = true,
  } = options;

  if (submissions.length === 0) {
    return {
      content: 'No submissions found',
      filename: 'submissions-empty.csv',
      contentType: 'text/csv',
    };
  }

  const rows: Record<string, any>[] = [];

  submissions.forEach(submission => {
    const row: Record<string, any> = {};

    // Add metadata columns
    if (includeMetadata) {
      row['Submission ID'] = submission.id;
      row['Client Name'] = submission.clientName;
      row['Client Email'] = submission.clientEmail;
      row['Form Title'] = submission.formTitle;
      row['Template Category'] = submission.templateCategory;
      row['Submitted At'] = dateFormat === 'iso'
        ? submission.submittedAt.toISOString()
        : formatDateForCsv(submission.submittedAt);
      row['Form Instance ID'] = submission.formInstanceId;
    }

    // Add form data columns
    if (includeFormData && submission.data) {
      if (flattenData) {
        const flattened = flattenNestedData(submission.data);
        Object.keys(flattened).forEach(key => {
          const formattedKey = formatFieldName(key);
          row[formattedKey] = flattened[key];
        });
      } else {
        // Add form data as a JSON string
        row['Form Data'] = JSON.stringify(submission.data);
      }
    }

    rows.push(row);
  });

  // Generate CSV headers
  const headers = Object.keys(rows[0] || {});

  // Convert to CSV format
  const csvData = rows.map(row => {
    return headers.map(header => formatCellValue(row[header] || ''));
  });

  const csvContent = stringify([headers, ...csvData], {
    header: false,
    quoted: true,
    quotedString: true,
    eof: true,
  });

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `submissions-${timestamp}.csv`;

  return {
    content: csvContent,
    filename,
    contentType: 'text/csv; charset=utf-8',
  };
}

export function generateSingleSubmissionCsv(
  submission: SubmissionListItem,
  options: ExportOptions = {}
): CsvExportResult {
  const {
    includeMetadata = true,
    includeFormData = true,
    dateFormat = 'localized',
  } = options;

  const rows: [string, string][] = [];

  // Add metadata
  if (includeMetadata) {
    rows.push(['Submission ID', submission.id]);
    rows.push(['Client Name', submission.clientName]);
    rows.push(['Client Email', submission.clientEmail]);
    rows.push(['Form Title', submission.formTitle]);
    rows.push(['Template Category', submission.templateCategory]);
    rows.push([
      'Submitted At',
      dateFormat === 'iso'
        ? submission.submittedAt.toISOString()
        : formatDateForCsv(submission.submittedAt)
    ]);
    rows.push(['Form Instance ID', submission.formInstanceId]);

    // Add empty row separator
    if (includeFormData && submission.data) {
      rows.push(['', '']);
      rows.push(['--- Form Data ---', '']);
    }
  }

  // Add form data
  if (includeFormData && submission.data) {
    const flattened = flattenNestedData(submission.data);
    Object.keys(flattened).sort().forEach(key => {
      const formattedKey = formatFieldName(key);
      const value = flattened[key];
      rows.push([formattedKey, value]);
    });
  }

  const csvContent = stringify(rows, {
    header: false,
    quoted: true,
    quotedString: true,
    eof: true,
  });

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const clientName = submission.clientName.replace(/[^a-zA-Z0-9]/g, '-');
  const filename = `submission-${clientName}-${timestamp}.csv`;

  return {
    content: csvContent,
    filename,
    contentType: 'text/csv; charset=utf-8',
  };
}

export function generateFormFieldsSummary(
  submissions: SubmissionListItem[]
): CsvExportResult {
  if (submissions.length === 0) {
    return {
      content: 'No submissions found',
      filename: 'fields-summary-empty.csv',
      contentType: 'text/csv',
    };
  }

  // Collect all unique fields across all submissions
  const fieldStats: Record<string, {
    count: number;
    sampleValues: Set<string>;
    fieldName: string;
  }> = {};

  submissions.forEach(submission => {
    if (submission.data) {
      const flattened = flattenNestedData(submission.data);
      Object.keys(flattened).forEach(key => {
        const formattedKey = formatFieldName(key);

        if (!fieldStats[formattedKey]) {
          fieldStats[formattedKey] = {
            count: 0,
            sampleValues: new Set(),
            fieldName: key,
          };
        }

        fieldStats[formattedKey].count++;
        const value = flattened[key];
        if (value && value.length < 50) { // Only collect short values as samples
          fieldStats[formattedKey].sampleValues.add(value);
        }
      });
    }
  });

  // Generate summary rows
  const rows: string[][] = [
    ['Field Name', 'Response Count', 'Response Rate', 'Sample Values']
  ];

  Object.keys(fieldStats).sort().forEach(fieldName => {
    const stats = fieldStats[fieldName];
    const responseRate = ((stats.count / submissions.length) * 100).toFixed(1);
    const sampleValues = Array.from(stats.sampleValues).slice(0, 3).join('; ');

    rows.push([
      fieldName,
      stats.count.toString(),
      `${responseRate}%`,
      sampleValues || 'N/A'
    ]);
  });

  const csvContent = stringify(rows, {
    header: false,
    quoted: true,
    quotedString: true,
    eof: true,
  });

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `form-fields-summary-${timestamp}.csv`;

  return {
    content: csvContent,
    filename,
    contentType: 'text/csv; charset=utf-8',
  };
}