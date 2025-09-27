import React from 'react';

interface SubmissionData {
  submissionId: string;
  submittedAt: Date;
  submittedData: Record<string, any>;
  template: {
    name: string;
  };
  owner: {
    name: string;
    email: string;
    rcicNumber: string;
  };
}

interface ConfirmationProps {
  submission: SubmissionData;
  token: string;
}

export function Confirmation({ submission, token }: ConfirmationProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-green-50 px-6 py-8 text-center border-b border-green-200">
            <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Form Submitted Successfully!</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Thank you for completing your {submission.template.name}. Your information has been securely submitted and received.
            </p>
          </div>

          {/* Submission Details */}
          <div className="px-6 py-8">
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Reference Number</dt>
                  <dd className="mt-1 text-lg font-mono text-gray-900 bg-white px-3 py-2 rounded border">
                    {submission.submissionId}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Submitted On</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(submission.submittedAt).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZoneName: 'short',
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Form Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{submission.template.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </span>
                  </dd>
                </div>
              </div>
            </div>

            {/* RCIC Contact Information */}
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Immigration Consultant</h2>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-medium text-gray-900">{submission.owner.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      RCIC #{submission.owner.rcicNumber}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">
                    <a
                      href={`mailto:${submission.owner.email}`}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {submission.owner.email}
                    </a>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Your consultant will review your submission and contact you if additional information is needed.
                  </p>
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-yellow-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Important Information</h2>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>
                    <strong>Save your reference number:</strong> {submission.submissionId} - You may need this for future correspondence.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>
                    Your consultant typically responds within 2-3 business days. Response times may vary based on complexity.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p>
                    Check your email regularly for updates from your consultant. Add {submission.owner.email} to your contacts to avoid missing important messages.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p>
                    This form can no longer be modified. If you need to make changes, please contact your consultant directly.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Confirmation
              </button>
              <a
                href={`mailto:${submission.owner.email}?subject=Regarding Form Submission ${submission.submissionId}&body=Hello ${submission.owner.name},%0A%0AI have submitted my ${submission.template.name} (Reference: ${submission.submissionId}) and wanted to follow up.%0A%0AThank you.`}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Consultant
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}