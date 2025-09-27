'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewClientPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    passportNumber: '',
    currentStatus: 'Visitor',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Canada',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/dashboard/clients');
      } else {
        setError(data.error || 'Failed to create client');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      setError('An error occurred while creating the client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <nav className="flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-4">
                  <li>
                    <Link href="/dashboard" className="text-gray-400 hover:text-gray-500">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <Link href="/dashboard/clients" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                        Clients
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-4 text-sm font-medium text-gray-500">New Client</span>
                    </div>
                  </li>
                </ol>
              </nav>
              <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Add New Client
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Enter your client's information to add them to your database.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      id="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">
                      Nationality
                    </label>
                    <input
                      type="text"
                      name="nationality"
                      id="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="passportNumber" className="block text-sm font-medium text-gray-700">
                      Passport Number
                    </label>
                    <input
                      type="text"
                      name="passportNumber"
                      id="passportNumber"
                      value={formData.passportNumber}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="currentStatus" className="block text-sm font-medium text-gray-700">
                      Current Immigration Status
                    </label>
                    <select
                      name="currentStatus"
                      id="currentStatus"
                      value={formData.currentStatus}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="Citizen">Citizen</option>
                      <option value="Permanent Resident">Permanent Resident</option>
                      <option value="Work Permit">Work Permit</option>
                      <option value="Study Permit">Study Permit</option>
                      <option value="Visitor">Visitor</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      id="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      id="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="province" className="block text-sm font-medium text-gray-700">
                      Province/State
                    </label>
                    <input
                      type="text"
                      name="province"
                      id="province"
                      value={formData.province}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                      Postal/Zip Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      id="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  name="notes"
                  id="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Any additional notes about this client..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}