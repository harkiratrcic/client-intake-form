'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SubmissionListItem } from '../../lib/services/submission-query-service';

interface SubmissionsTableProps {
  submissions: SubmissionListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onDateFilter: (startDate?: string, endDate?: string) => void;
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

export function SubmissionsTable({
  submissions,
  total,
  page,
  limit,
  totalPages,
  onPageChange,
  onSearch,
  onDateFilter,
  onSort,
}: SubmissionsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const handleSort = (column: string) => {
    const newSortOrder = sortBy === column && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(column);
    setSortOrder(newSortOrder);
    onSort(column, newSortOrder);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleDateFilter = () => {
    onDateFilter(
      dateRange.startDate || undefined,
      dateRange.endDate || undefined
    );
  };

  const getStatusBadge = (submission: SubmissionListItem) => {
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

  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  return (
    <div className="bg-white shadow overflow-hidden rounded-md">
      {/* Search and Filter Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              className="flex-1 rounded-l-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border"
              placeholder="Search by client name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          <div className="flex gap-2">
            <input
              type="date"
              className="flex-1 rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Start date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
            <input
              type="date"
              className="flex-1 rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="End date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
            <button
              onClick={handleDateFilter}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
            >
              Filter
            </button>
          </div>

          <div className="flex justify-end">
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              onClick={() => window.print()}
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {submissions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('clientEmail')}
                >
                  <div className="flex items-center">
                    Client
                    <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortBy === 'clientEmail' && sortOrder === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                    </svg>
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('formTitle')}
                >
                  <div className="flex items-center">
                    Form Type
                    <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortBy === 'formTitle' && sortOrder === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('submittedAt')}
                >
                  <div className="flex items-center">
                    Submitted
                    <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortBy === 'submittedAt' && sortOrder === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.map((submission) => {
                const status = getStatusBadge(submission);
                return (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{submission.clientName}</div>
                        <div className="text-sm text-gray-500">{submission.clientEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{submission.formTitle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        {submission.templateCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/submissions/${submission.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions</h3>
          <p className="mt-1 text-sm text-gray-500">No form submissions have been received yet.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex}</span> to{' '}
                  <span className="font-medium">{endIndex}</span> of{' '}
                  <span className="font-medium">{total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => onPageChange(index + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === index + 1
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}