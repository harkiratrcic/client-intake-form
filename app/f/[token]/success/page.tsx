import React from 'react';
import { notFound } from 'next/navigation';
import { getSubmission } from '../../../../lib/services/submission-service';
import { Confirmation } from '../../../../components/form/confirmation';

interface Props {
  params: {
    token: string;
  };
}

export default async function SuccessPage({ params }: Props) {
  const submission = await getSubmission(params.token);

  if ('error' in submission) {
    if (submission.error === 'Form not found') {
      notFound();
    }

    // If form hasn't been submitted yet, redirect to form
    if (submission.error === 'Form has not been submitted') {
      // In a real app, we would redirect here, but Next.js requires this to be a client component
      // for redirects, so we'll show an error message
      return (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow-sm rounded-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4">
                <svg className="w-16 h-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Not Submitted Yet</h1>
              <p className="text-gray-600 mb-6">
                This form has not been submitted. Please complete and submit the form first.
              </p>
              <a
                href={`/f/${params.token}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Form
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Other errors
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-sm rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600">{submission.error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Confirmation
      submission={submission}
      token={params.token}
    />
  );
}

export async function generateMetadata({ params }: Props) {
  const submission = await getSubmission(params.token);

  if ('error' in submission) {
    return {
      title: 'Submission Status',
    };
  }

  return {
    title: `Submission Confirmed - ${submission.template.name}`,
    description: `Your ${submission.template.name} has been successfully submitted. Reference: ${submission.submissionId}`,
  };
}