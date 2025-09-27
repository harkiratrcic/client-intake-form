import React from 'react';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getServerSession } from '../../../../lib/auth/server-session';
import { Header } from '../../../../components/dashboard/header';
import { Sidebar } from '../../../../components/dashboard/sidebar';
import { prisma } from '../../../../lib/prisma';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientDetailPage({ params }: Props) {
  // Check authentication
  const session = await getServerSession();
  if (!session.success) {
    redirect('/login');
  }

  const { id } = await params;

  // Fetch client details
  const client = await prisma.client.findFirst({
    where: {
      id,
      ownerId: session.owner.id,
    },
  });

  if (!client) {
    notFound();
  }

  // Fetch forms sent to this client
  const forms = await prisma.formInstance.findMany({
    where: {
      clientEmail: client.email,
      ownerId: session.owner.id,
    },
    include: {
      template: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header owner={session.owner} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Breadcrumb */}
              <nav className="flex mb-6" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-4">
                  <li>
                    <div>
                      <Link href="/dashboard" className="text-gray-400 hover:text-gray-500">
                        <svg className="flex-shrink-0 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        <span className="sr-only">Home</span>
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <Link href="/dashboard/clients" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                        Clients
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-4 text-sm font-medium text-gray-900">
                        {client.firstName} {client.lastName}
                      </span>
                    </div>
                  </li>
                </ol>
              </nav>

              {/* Header */}
              <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    {client.firstName} {client.lastName}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Client since {formatDate(client.createdAt)}
                  </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                  <Link
                    href={`/dashboard/forms/new?clientName=${encodeURIComponent(client.firstName + ' ' + client.lastName)}&clientEmail=${encodeURIComponent(client.email)}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Form
                  </Link>
                  <Link
                    href={`/dashboard/clients/${client.id}/edit`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Client
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Client Information */}
                <div className="lg:col-span-2">
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Client Information</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and contact information.</p>
                    </div>
                    <div className="border-t border-gray-200">
                      <dl>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Full name</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {client.firstName} {client.lastName}
                          </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Email address</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            <a href={`mailto:${client.email}`} className="text-indigo-600 hover:text-indigo-500">
                              {client.email}
                            </a>
                          </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {client.phone || '—'}
                          </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Date of birth</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {client.dateOfBirth ? formatDate(client.dateOfBirth) : '—'}
                          </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Nationality</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {client.nationality || '—'}
                          </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Passport number</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {client.passportNumber || '—'}
                          </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Current status</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {client.currentStatus || '—'}
                            </span>
                          </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">Address</dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {client.address && (
                              <div>
                                <div>{client.address}</div>
                                {(client.city || client.province) && (
                                  <div>
                                    {client.city}
                                    {client.city && client.province && ', '}
                                    {client.province}
                                    {client.postalCode && ` ${client.postalCode}`}
                                  </div>
                                )}
                                {client.country && <div>{client.country}</div>}
                              </div>
                            ) || '—'}
                          </dd>
                        </div>
                        {client.notes && (
                          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Notes</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {client.notes}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                </div>

                {/* Forms & Activity */}
                <div>
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Forms & Activity</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">Recent forms sent to this client.</p>
                    </div>
                    <div className="border-t border-gray-200">
                      {forms.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                          {forms.map((form) => (
                            <li key={form.id} className="px-4 py-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {form.template.name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {formatDateTime(form.createdAt)}
                                  </p>
                                </div>
                                <div className="flex-shrink-0">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    form.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                                    form.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                                    form.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {form.status.replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                              {form.expiresAt && (
                                <p className="mt-1 text-xs text-gray-400">
                                  Expires: {formatDateTime(form.expiresAt)}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No forms sent</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Get started by sending this client their first form.
                          </p>
                          <div className="mt-6">
                            <Link
                              href={`/dashboard/forms/new?clientName=${encodeURIComponent(client.firstName + ' ' + client.lastName)}&clientEmail=${encodeURIComponent(client.email)}`}
                              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                              </svg>
                              Send First Form
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;

  // Try to get client name for metadata
  try {
    const session = await getServerSession();
    if (session.success) {
      const client = await prisma.client.findFirst({
        where: {
          id,
          ownerId: session.owner.id,
        },
        select: {
          firstName: true,
          lastName: true,
        },
      });

      if (client) {
        return {
          title: `${client.firstName} ${client.lastName} - Client Details`,
          description: `View details and forms for ${client.firstName} ${client.lastName}`,
        };
      }
    }
  } catch (error) {
    // Fallback if there's any error
  }

  return {
    title: 'Client Details - FormFlow Dashboard',
    description: 'View client details and form history.',
  };
}