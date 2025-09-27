'use client';

import React from 'react';
import Link from 'next/link';
import { SubmissionListItem } from '../../lib/services/submission-query-service';

interface SubmissionViewerProps {
  submission: SubmissionListItem & {
    formInstance?: {
      template?: {
        schema?: {
          fields?: Array<{
            name: string;
            type: string;
            label: string;
            required?: boolean;
            options?: string[];
          }>;
        };
      };
    };
  };
}

export function SubmissionViewer({ submission }: SubmissionViewerProps) {
  const getStatusBadge = () => {
    const daysSinceSubmission = Math.floor(
      (Date.now() - new Date(submission.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceSubmission === 0) {
      return {
        color: 'bg-green-100 text-green-800',
        text: 'New',
      };
    } else if (daysSinceSubmission <= 7) {
      return {
        color: 'bg-blue-100 text-blue-800',
        text: 'Recent',
      };
    } else {
      return {
        color: 'bg-gray-100 text-gray-800',
        text: 'Reviewed',
      };
    }
  };

  const formatFieldValue = (value: any, fieldType?: string): string => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (fieldType === 'date' && typeof value === 'string') {
      try {
        return new Date(value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch {
        return value;
      }
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  };

  const getFieldLabel = (fieldName: string): string => {
    const field = submission.formInstance?.template?.schema?.fields?.find(
      f => f.name === fieldName
    );
    return field?.label || fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const getFieldType = (fieldName: string): string => {
    const field = submission.formInstance?.template?.schema?.fields?.find(
      f => f.name === fieldName
    );
    return field?.type || 'text';
  };

  const sortedFields = Object.entries(submission.data || {}).sort(([a], [b]) => {
    // Sort by field order in schema if available
    const schema = submission.formInstance?.template?.schema?.fields;
    if (schema) {
      const aIndex = schema.findIndex(f => f.name === a);
      const bIndex = schema.findIndex(f => f.name === b);
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
    }
    // Fallback to alphabetical sort
    return a.localeCompare(b);
  });

  const status = getStatusBadge();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div>
                <Link href="/dashboard" className="text-gray-400 hover:text-gray-500">
                  <svg className="flex-shrink-0 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  </svg>
                  <span className="sr-only">Dashboard</span>
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <Link href="/dashboard/submissions" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                  Submissions
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-4 text-sm font-medium text-gray-500">Submission Details</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {submission.formTitle}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Submitted by {submission.clientName} on {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Submission Info Card */}
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Submission Information</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Client Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{submission.clientName}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Client Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{submission.clientEmail}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Form Type</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{submission.formTitle}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                  {submission.templateCategory}
                </span>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Submitted</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 sm:mt-0 sm:col-span-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                  {status.text}
                </span>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Submission ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">{submission.id}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Form Data */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Form Data</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Information submitted by the client.
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl className="sm:divide-y sm:divide-gray-200">
            {sortedFields.length > 0 ? (
              sortedFields.map(([fieldName, fieldValue]) => (
                <div key={fieldName} className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    {getFieldLabel(fieldName)}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="whitespace-pre-wrap break-words">
                      {formatFieldValue(fieldValue, getFieldType(fieldName))}
                    </div>
                  </dd>
                </div>
              ))
            ) : (
              <div className="py-4 sm:py-5 sm:px-6 text-center">
                <p className="text-sm text-gray-500">No form data available.</p>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }

          .print-friendly {
            page-break-inside: avoid;
          }

          body {
            font-size: 12px;
            line-height: 1.3;
          }

          h1, h2, h3 {
            color: #000 !important;
          }

          .bg-white {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}