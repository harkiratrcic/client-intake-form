import React from 'react';
import Link from 'next/link';
import { getServerSession } from '../../../lib/auth/server-session';
import { redirect } from 'next/navigation';
import { getDashboardStats, getRecentSubmissions, getExpiringForms } from '../../../lib/services/stats-service';
import { StatsCard } from '../../../components/dashboard/stats-card';

export default async function DashboardPage() {
  // Get session for owner ID
  const session = await getServerSession();
  if (!session.success) {
    redirect('/login');
  }

  const ownerId = session.owner.id;

  // Fetch dashboard data
  const [stats, recentSubmissions, expiringForms] = await Promise.all([
    getDashboardStats(ownerId),
    getRecentSubmissions(ownerId, 5),
    getExpiringForms(ownerId, 7)
  ]);

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {session.owner.email}. Here's your immigration practice overview.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/dashboard/forms/new"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Form
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="mt-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Forms"
            value={stats.totalForms}
            description="All forms created"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <StatsCard
            title="Active Forms"
            value={stats.activeForms}
            description="Awaiting submission"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Submitted Forms"
            value={stats.submittedForms}
            description="Completed submissions"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Expired Forms"
            value={stats.expiredForms}
            description="Past deadline"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            }
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Submissions */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Submissions
              </h3>
              <Link
                href="/dashboard/submissions"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                View all
              </Link>
            </div>
            <div className="mt-4">
              {recentSubmissions.length > 0 ? (
                <div className="flow-root">
                  <ul className="-my-3 divide-y divide-gray-200">
                    {recentSubmissions.map((submission) => (
                      <li key={submission.id} className="py-3">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                              <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {submission.formInstance.clientEmail}
                            </p>
                            <p className="text-sm text-gray-500">
                              Submitted {submission.submittedAt.toLocaleDateString()} • ID: {submission.submissionId}
                            </p>
                          </div>
                          <div>
                            <Link
                              href={`/dashboard/submissions/${submission.submissionId}`}
                              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    When clients submit forms, they'll appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expiring Forms */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Forms Expiring Soon
              </h3>
              <Link
                href="/dashboard/forms"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                View all
              </Link>
            </div>
            <div className="mt-4">
              {expiringForms.length > 0 ? (
                <div className="flow-root">
                  <ul className="-my-3 divide-y divide-gray-200">
                    {expiringForms.map((form) => (
                      <li key={form.id} className="py-3">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              form.daysUntilExpiry <= 1 ? 'bg-red-100' : form.daysUntilExpiry <= 3 ? 'bg-yellow-100' : 'bg-orange-100'
                            }`}>
                              <svg className={`h-4 w-4 ${
                                form.daysUntilExpiry <= 1 ? 'text-red-600' : form.daysUntilExpiry <= 3 ? 'text-yellow-600' : 'text-orange-600'
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {form.clientEmail}
                            </p>
                            <p className="text-sm text-gray-500">
                              Expires {form.daysUntilExpiry === 1 ? 'tomorrow' : `in ${form.daysUntilExpiry} days`}
                            </p>
                          </div>
                          <div>
                            <Link
                              href={`/f/${form.token}`}
                              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              View Form
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No forms expiring soon</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    All your active forms have plenty of time remaining.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Quick Actions
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/dashboard/forms/new"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 border border-gray-300 rounded-lg hover:border-gray-400"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Create New Form
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Send a new client intake form to collect information.
                  </p>
                </div>
              </Link>

              <Link
                href="/dashboard/templates"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 border border-gray-300 rounded-lg hover:border-gray-400"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Manage Templates
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Create and edit form templates for different immigration services.
                  </p>
                </div>
              </Link>

              <Link
                href="/dashboard/clients"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 border border-gray-300 rounded-lg hover:border-gray-400"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-700 ring-4 ring-white">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    View Clients
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Access your client database and contact information.
                  </p>
                </div>
              </Link>

              <Link
                href="/dashboard/analytics"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 border border-gray-300 rounded-lg hover:border-gray-400"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    View Analytics
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Analyze your practice performance and client engagement.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}