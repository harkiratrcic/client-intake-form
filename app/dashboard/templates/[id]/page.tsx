import React from 'react';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getServerSession } from '../../../../lib/auth/server-session';
import { Header } from '../../../../components/dashboard/header';
import { Sidebar } from '../../../../components/dashboard/sidebar';
import { TemplateService } from '../../../../lib/services/template-service';
import { prisma } from '../../../../lib/prisma';

interface TemplateDetailPageProps {
  params: {
    id: string;
  };
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  // Check authentication
  const session = await getServerSession();
  if (!session.success) {
    redirect('/login');
  }

  // Fetch template
  const templateService = new TemplateService(prisma);
  const template = await templateService.getTemplateById(params.id);

  if (!template) {
    notFound();
  }

  // Get field count and usage statistics
  const fieldCount = template.fieldSchema?.properties ? Object.keys(template.fieldSchema.properties).length : 0;

  // Get usage count (how many forms use this template)
  const usageCount = await prisma.formInstance.count({
    where: {
      templateId: template.id,
    },
  });

  // Extract fields from schema
  const fields = template.fieldSchema?.properties
    ? Object.entries(template.fieldSchema.properties).map(([key, value]: [string, any]) => ({
        name: key,
        label: value.title || key,
        type: value.type,
        format: value.format,
        required: template.fieldSchema?.required?.includes(key) || false,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header owner={session.owner} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Header with back button */}
              <div className="mb-6">
                <Link
                  href="/dashboard/templates"
                  className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Templates
                </Link>
              </div>

              {/* Template Header */}
              <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    {template.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {template.description}
                  </p>
                  <div className="mt-3 flex items-center space-x-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                    <span className="text-xs text-gray-500">
                      Version {template.version}
                    </span>
                    <span className="text-xs text-gray-500">
                      Created {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                  <Link
                    href={`/dashboard/forms/new?templateId=${template.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Form
                  </Link>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Fields</dt>
                          <dd className="text-lg font-medium text-gray-900">{fieldCount}</dd>
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Times Used</dt>
                          <dd className="text-lg font-medium text-gray-900">{usageCount}</dd>
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Status</dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {template.isActive ? 'Active' : 'Inactive'}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Fields */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Template Fields
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    The fields that will be included in forms created from this template.
                  </p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  {fields.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-500">No fields defined for this template.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Field Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Label
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Required
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {fields.map((field) => (
                            <tr key={field.name}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {field.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{field.label}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  {field.format || field.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {field.required ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Yes
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    No
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Forms using this template */}
              {usageCount > 0 && (
                <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Forms Using This Template
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      View all forms that have been created using this template.
                    </p>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    <Link
                      href={`/dashboard/forms?templateId=${template.id}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      View All Forms ({usageCount})
                      <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: TemplateDetailPageProps) {
  const templateService = new TemplateService(prisma);
  const template = await templateService.getTemplateById(params.id);

  return {
    title: template ? `${template.name} - Template Details` : 'Template Not Found',
    description: template?.description || 'View template details and fields.',
  };
}