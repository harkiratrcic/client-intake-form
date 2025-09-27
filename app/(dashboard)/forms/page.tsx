import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from '../../../lib/auth/server-session';
import { getFormsForOwner, FormsQueryOptions } from '../../../lib/services/forms-query-service';
import { FormsTableClient } from './forms-table-client';

interface FormsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function FormsPage({ searchParams }: FormsPageProps) {
  // Check authentication
  const session = await getServerSession();
  if (!session.success) {
    redirect('/login');
  }

  const ownerId = session.owner.id;

  // Parse search params
  const params = await searchParams;
  const pageNum = parseInt(params.page || '1', 10);
  const page = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
  const search = params.search || '';
  const status = params.status as 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | undefined;
  const sortBy = params.sortBy as 'createdAt' | 'updatedAt' | 'clientEmail' | 'status' | 'expiresAt' | undefined;
  const sortOrder = params.sortOrder as 'asc' | 'desc' | undefined;

  // Build query options
  const queryOptions: FormsQueryOptions = {
    page,
    limit: 10,
    search,
    status,
    sortBy: sortBy || 'createdAt',
    sortOrder: sortOrder || 'desc',
  };

  // Fetch forms
  const formsResult = await getFormsForOwner(ownerId, queryOptions);

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Forms
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage all client intake forms sent from your practice.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/forms/new"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Form
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Forms</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formsResult.forms.filter(f => f.status === 'SENT' && !f.isExpired).length}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formsResult.forms.filter(f => f.status === 'IN_PROGRESS').length}
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
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formsResult.forms.filter(f => f.status === 'COMPLETED').length}
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
                <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Expired</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formsResult.forms.filter(f => f.isExpired).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forms Table */}
      <div className="mt-8">
        <FormsTableClient
          initialData={formsResult}
          initialSearchParams={{
            search,
            status,
            sortBy: sortBy || 'createdAt',
            sortOrder: sortOrder || 'desc',
          }}
        />
      </div>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Forms - FormFlow Dashboard',
    description: 'Manage client intake forms sent from your immigration practice.',
  };
}