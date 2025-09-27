'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../../../components/dashboard/header';
import { Sidebar } from '../../../../components/dashboard/sidebar';

export default function NewTemplatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Immigration',
    fields: [
      { name: 'fullName', type: 'text', label: 'Full Name', required: true },
      { name: 'email', type: 'email', label: 'Email Address', required: true }
    ]
  });

  const addField = () => {
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, { name: '', type: 'text', label: '', required: false }]
    }));
  };

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const updateField = (index: number, field: any) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => i === index ? field : f)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          fields: formData.fields
        }),
      });

      if (response.ok) {
        router.push('/dashboard/templates');
      } else {
        console.error('Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header owner={{ email: 'owner@test.com' }} />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 overflow-y-auto">
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    Create New Template
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Design a reusable form template for your immigration practice.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <form onSubmit={handleSubmit} className="space-y-6 p-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Template Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="e.g., Advanced Express Entry Assessment"
                        />
                      </div>

                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                          Category
                        </label>
                        <select
                          id="category"
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="Immigration">Immigration</option>
                          <option value="Express Entry">Express Entry</option>
                          <option value="Family Class">Family Class</option>
                          <option value="Study Permits">Study Permits</option>
                          <option value="Work Permits">Work Permits</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        rows={3}
                        required
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Describe what this template is used for..."
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">Form Fields</h3>
                        <button
                          type="button"
                          onClick={addField}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                        >
                          Add Field
                        </button>
                      </div>

                      <div className="mt-4 space-y-4">
                        {formData.fields.map((field, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Field Name</label>
                                <input
                                  type="text"
                                  value={field.name}
                                  onChange={(e) => updateField(index, { ...field, name: e.target.value })}
                                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  placeholder="e.g., fullName"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700">Label</label>
                                <input
                                  type="text"
                                  value={field.label}
                                  onChange={(e) => updateField(index, { ...field, label: e.target.value })}
                                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  placeholder="e.g., Full Name"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select
                                  value={field.type}
                                  onChange={(e) => updateField(index, { ...field, type: e.target.value })}
                                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                  <option value="text">Text</option>
                                  <option value="email">Email</option>
                                  <option value="tel">Phone</option>
                                  <option value="date">Date</option>
                                  <option value="number">Number</option>
                                  <option value="select">Select</option>
                                  <option value="textarea">Textarea</option>
                                </select>
                              </div>

                              <div className="flex items-center justify-between">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={(e) => updateField(index, { ...field, required: e.target.checked })}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Required</span>
                                </label>

                                {formData.fields.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeField(index)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
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
                        {isSubmitting ? 'Creating...' : 'Create Template'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}