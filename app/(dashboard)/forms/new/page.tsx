import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '../../../../lib/auth/get-session';
import { FormCreator } from '../../../../components/dashboard/form-creator';

// Force this page to be dynamic since it requires authentication
export const dynamic = 'force-dynamic';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  schema: any;
  isActive: boolean;
}

async function getTemplates(): Promise<Template[]> {
  // In a real implementation, this would fetch from the database
  // For now, return some mock templates based on the existing schema
  return [
    {
      id: 'basic-intake',
      name: 'Basic Client Intake',
      description: 'Standard immigration client information collection form',
      category: 'Immigration',
      schema: {
        fields: [
          { name: 'fullName', type: 'text', required: true, label: 'Full Name' },
          { name: 'email', type: 'email', required: true, label: 'Email Address' },
          { name: 'phone', type: 'tel', required: true, label: 'Phone Number' },
          { name: 'dateOfBirth', type: 'date', required: true, label: 'Date of Birth' },
          { name: 'nationality', type: 'text', required: true, label: 'Nationality' },
          { name: 'passportNumber', type: 'text', required: false, label: 'Passport Number' },
          { name: 'currentStatus', type: 'select', required: true, label: 'Current Immigration Status', options: ['Citizen', 'Permanent Resident', 'Work Permit', 'Student Permit', 'Visitor', 'Other'] },
          { name: 'address', type: 'textarea', required: true, label: 'Current Address' },
          { name: 'employmentInfo', type: 'textarea', required: false, label: 'Employment Information' },
          { name: 'immigrationGoals', type: 'textarea', required: true, label: 'Immigration Goals' }
        ]
      },
      isActive: true,
    },
    {
      id: 'express-entry',
      name: 'Express Entry Assessment',
      description: 'Comprehensive form for Express Entry program eligibility assessment',
      category: 'Express Entry',
      schema: {
        fields: [
          { name: 'fullName', type: 'text', required: true, label: 'Full Name' },
          { name: 'email', type: 'email', required: true, label: 'Email Address' },
          { name: 'age', type: 'number', required: true, label: 'Age', min: 18, max: 100 },
          { name: 'maritalStatus', type: 'select', required: true, label: 'Marital Status', options: ['Single', 'Married', 'Common-law', 'Divorced', 'Widowed'] },
          { name: 'education', type: 'select', required: true, label: 'Highest Education', options: ['High School', 'College Diploma', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Professional Degree'] },
          { name: 'workExperience', type: 'number', required: true, label: 'Years of Work Experience', min: 0, max: 50 },
          { name: 'languageEnglish', type: 'select', required: true, label: 'English Proficiency', options: ['Beginner', 'Intermediate', 'Advanced', 'Native'] },
          { name: 'languageFrench', type: 'select', required: false, label: 'French Proficiency', options: ['None', 'Beginner', 'Intermediate', 'Advanced', 'Native'] },
          { name: 'canadaExperience', type: 'select', required: true, label: 'Canadian Work Experience', options: ['None', '1 year', '2-3 years', '4+ years'] },
          { name: 'jobOffer', type: 'select', required: true, label: 'Job Offer in Canada', options: ['Yes', 'No'] },
          { name: 'funds', type: 'number', required: true, label: 'Settlement Funds (CAD)', min: 0 }
        ]
      },
      isActive: true,
    },
    {
      id: 'family-sponsorship',
      name: 'Family Sponsorship',
      description: 'Form for sponsoring family members for Canadian immigration',
      category: 'Family Class',
      schema: {
        fields: [
          { name: 'sponsorName', type: 'text', required: true, label: 'Sponsor Full Name' },
          { name: 'sponsorEmail', type: 'email', required: true, label: 'Sponsor Email' },
          { name: 'sponsorStatus', type: 'select', required: true, label: 'Sponsor Status', options: ['Canadian Citizen', 'Permanent Resident'] },
          { name: 'relationship', type: 'select', required: true, label: 'Relationship to Applicant', options: ['Spouse', 'Child', 'Parent', 'Grandparent', 'Other'] },
          { name: 'applicantName', type: 'text', required: true, label: 'Applicant Full Name' },
          { name: 'applicantDOB', type: 'date', required: true, label: 'Applicant Date of Birth' },
          { name: 'applicantNationality', type: 'text', required: true, label: 'Applicant Nationality' },
          { name: 'marriageDate', type: 'date', required: false, label: 'Marriage Date (if applicable)' },
          { name: 'income', type: 'number', required: true, label: 'Annual Income (CAD)', min: 0 },
          { name: 'dependents', type: 'number', required: true, label: 'Number of Dependents', min: 0 },
          { name: 'previousApplications', type: 'textarea', required: false, label: 'Previous Immigration Applications' }
        ]
      },
      isActive: true,
    },
    {
      id: 'study-permit',
      name: 'Study Permit Application',
      description: 'Initial assessment for study permit applications',
      category: 'Study Permits',
      schema: {
        fields: [
          { name: 'fullName', type: 'text', required: true, label: 'Full Name' },
          { name: 'email', type: 'email', required: true, label: 'Email Address' },
          { name: 'dateOfBirth', type: 'date', required: true, label: 'Date of Birth' },
          { name: 'nationality', type: 'text', required: true, label: 'Nationality' },
          { name: 'currentCountry', type: 'text', required: true, label: 'Country of Residence' },
          { name: 'educationLevel', type: 'select', required: true, label: 'Current Education Level', options: ['High School', 'College', 'University Undergraduate', 'University Graduate'] },
          { name: 'intendedProgram', type: 'text', required: true, label: 'Intended Program of Study' },
          { name: 'institution', type: 'text', required: false, label: 'Preferred Institution' },
          { name: 'startDate', type: 'date', required: true, label: 'Intended Start Date' },
          { name: 'programDuration', type: 'select', required: true, label: 'Program Duration', options: ['Less than 6 months', '6 months to 1 year', '1-2 years', '2-3 years', '3+ years'] },
          { name: 'financialSupport', type: 'select', required: true, label: 'Financial Support', options: ['Self-funded', 'Family support', 'Scholarship', 'Government funding', 'Other'] },
          { name: 'englishProficiency', type: 'select', required: true, label: 'English Proficiency Test', options: ['IELTS', 'TOEFL', 'Not taken yet', 'Not required'] }
        ]
      },
      isActive: true,
    }
  ];
}

export default async function NewFormPage() {
  // Get session for authentication
  const session = await getSession();
  if (!session || !session.owner) {
    redirect('/login');
  }

  // Fetch available templates
  const templates = await getTemplates();

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <div>
                  <Link href="/dashboard" className="text-gray-400 hover:text-gray-500">
                    <svg className="flex-shrink-0 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                    <span className="sr-only">Dashboard</span>
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <Link href="/dashboard/forms" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Forms
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">New Form</span>
                </div>
              </li>
            </ol>
          </nav>
          <h2 className="mt-2 text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Create New Form
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Send a personalized intake form to your client. They'll receive an email with a secure link to complete the form.
          </p>
        </div>
      </div>

      {/* Form Creator */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-6">
          <FormCreator initialTemplates={templates} />
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">How it works</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ol className="list-decimal list-inside space-y-1">
                <li>Select a template that matches your client's immigration needs</li>
                <li>Enter your client's name and email address</li>
                <li>Set how long the client has to complete the form (1-90 days)</li>
                <li>Add a personal message to include in the email (optional)</li>
                <li>Click "Create Form & Send to Client" to generate and send the form</li>
              </ol>
              <p className="mt-3">
                Your client will receive a secure email with a link to complete the form. You can track the status and view submissions in the Forms section.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Template Information */}
      <div className="mt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Available Templates</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {templates.map((template) => (
            <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  <div className="mt-2 flex items-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {template.category}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {template.schema.fields.length} fields
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Create New Form - FormFlow Dashboard',
    description: 'Create and send personalized intake forms to your immigration clients.',
  };
}