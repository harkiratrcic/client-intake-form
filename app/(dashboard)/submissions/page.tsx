import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '../../../lib/auth/get-session';
import { getSubmissionsForOwner, SubmissionQueryOptions } from '../../../lib/services/submission-query-service';
import { SubmissionsTableClient } from './submissions-table-client';

interface SubmissionsPageProps {
  searchParams: {
    page?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

export default async function SubmissionsPage({ searchParams }: SubmissionsPageProps) {
  // Get session for owner ID
  const session = await getSession();
  if (!session || !session.owner) {
    redirect('/login');
  }

  const ownerId = session.owner.id;

  // Parse search params
  const pageNum = parseInt(searchParams.page || '1', 10);
  const page = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
  const search = searchParams.search || '';
  const sortBy = searchParams.sortBy as 'submittedAt' | 'clientEmail' | 'formTitle' | undefined;
  const sortOrder = searchParams.sortOrder as 'asc' | 'desc' | undefined;

  // Parse dates
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (searchParams.startDate) {
    const parsedStartDate = new Date(searchParams.startDate);
    if (!isNaN(parsedStartDate.getTime())) {
      startDate = parsedStartDate;
    }
  }

  if (searchParams.endDate) {
    const parsedEndDate = new Date(searchParams.endDate);
    if (!isNaN(parsedEndDate.getTime())) {
      endDate = parsedEndDate;
      // Set to end of day
      endDate.setHours(23, 59, 59, 999);
    }
  }

  // Build query options
  const queryOptions: SubmissionQueryOptions = {
    page,
    limit: 10,
    search,
    startDate,
    endDate,
    sortBy: sortBy || 'submittedAt',
    sortOrder: sortOrder || 'desc',
  };

  // Fetch submissions
  const submissionsResult = await getSubmissionsForOwner(ownerId, queryOptions);

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Submissions
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all completed form submissions from your clients.
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Submissions</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {submissionsResult.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">This Week</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {submissionsResult.submissions.filter(s => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return new Date(s.submittedAt) > weekAgo;
                    }).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">New Today</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {submissionsResult.submissions.filter(s => {
                      const today = new Date();
                      const submissionDate = new Date(s.submittedAt);
                      return submissionDate.toDateString() === today.toDateString();
                    }).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Form Types</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {new Set(submissionsResult.submissions.map(s => s.templateCategory)).size}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="mt-8">
        <SubmissionsTableClient
          initialData={submissionsResult}
          initialSearchParams={{
            search,
            startDate: searchParams.startDate,
            endDate: searchParams.endDate,
            sortBy: sortBy || 'submittedAt',
            sortOrder: sortOrder || 'desc',
          }}
        />
      </div>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Submissions - FormFlow Dashboard',
    description: 'View and manage all completed form submissions from your clients.',
  };
}