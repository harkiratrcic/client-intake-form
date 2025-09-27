import React from 'react';
import { LoginForm } from '../../components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-indigo-100 rounded-lg">
            <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your immigration consultant dashboard
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <LoginForm />
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            FormFlow - Secure Immigration Form Management
          </p>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Sign In - FormFlow',
    description: 'Sign in to your immigration consultant dashboard.',
  };
}