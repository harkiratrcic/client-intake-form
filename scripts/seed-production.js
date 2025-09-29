#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const templates = [
  {
    id: 'basic-intake',
    name: 'Basic Client Intake',
    slug: 'basic-intake',
    description: 'Standard immigration client information collection form',
    fieldSchema: {
      type: "object",
      properties: {
        fullName: { type: "string", title: "Full Name" },
        email: { type: "string", format: "email", title: "Email Address" },
        phone: { type: "string", title: "Phone Number" },
        dateOfBirth: { type: "string", format: "date", title: "Date of Birth" },
        nationality: { type: "string", title: "Nationality" },
        passportNumber: { type: "string", title: "Passport Number" },
        currentStatus: {
          type: "string",
          title: "Current Immigration Status",
          enum: ["Citizen", "Permanent Resident", "Work Permit", "Student Permit", "Visitor", "Other"]
        },
        address: { type: "string", title: "Current Address" },
        employmentInfo: { type: "string", title: "Employment Information" },
        immigrationGoals: { type: "string", title: "Immigration Goals" }
      },
      required: ["fullName", "email", "phone", "dateOfBirth", "nationality", "currentStatus", "address", "immigrationGoals"]
    },
    uiSchema: {
      address: { "ui:widget": "textarea" },
      employmentInfo: { "ui:widget": "textarea" },
      immigrationGoals: { "ui:widget": "textarea" }
    }
  },
  {
    id: 'express-entry',
    name: 'Express Entry Assessment',
    slug: 'express-entry',
    description: 'Comprehensive form for Express Entry program eligibility assessment',
    fieldSchema: {
      type: "object",
      properties: {
        fullName: { type: "string", title: "Full Name" },
        email: { type: "string", format: "email", title: "Email Address" },
        age: { type: "integer", title: "Age", minimum: 18, maximum: 100 },
        maritalStatus: {
          type: "string",
          title: "Marital Status",
          enum: ["Single", "Married", "Common-law", "Divorced", "Widowed"]
        },
        education: {
          type: "string",
          title: "Highest Education",
          enum: ["High School", "College Diploma", "Bachelor's Degree", "Master's Degree", "PhD", "Professional Degree"]
        },
        workExperience: { type: "integer", title: "Years of Work Experience", minimum: 0, maximum: 50 },
        languageEnglish: {
          type: "string",
          title: "English Proficiency",
          enum: ["Beginner", "Intermediate", "Advanced", "Native"]
        },
        languageFrench: {
          type: "string",
          title: "French Proficiency",
          enum: ["None", "Beginner", "Intermediate", "Advanced", "Native"]
        },
        canadaExperience: {
          type: "string",
          title: "Canadian Work Experience",
          enum: ["None", "1 year", "2-3 years", "4+ years"]
        },
        jobOffer: {
          type: "string",
          title: "Job Offer in Canada",
          enum: ["Yes", "No"]
        },
        funds: { type: "number", title: "Settlement Funds (CAD)", minimum: 0 }
      },
      required: ["fullName", "email", "age", "maritalStatus", "education", "workExperience", "languageEnglish", "canadaExperience", "jobOffer", "funds"]
    },
    uiSchema: {}
  },
  {
    id: 'family-sponsorship',
    name: 'Family Sponsorship',
    slug: 'family-sponsorship',
    description: 'Form for sponsoring family members for Canadian immigration',
    fieldSchema: {
      type: "object",
      properties: {
        sponsorName: { type: "string", title: "Sponsor Full Name" },
        sponsorEmail: { type: "string", format: "email", title: "Sponsor Email" },
        sponsorStatus: {
          type: "string",
          title: "Sponsor Status",
          enum: ["Canadian Citizen", "Permanent Resident"]
        },
        relationship: {
          type: "string",
          title: "Relationship to Applicant",
          enum: ["Spouse", "Child", "Parent", "Grandparent", "Other"]
        },
        applicantName: { type: "string", title: "Applicant Full Name" },
        applicantDOB: { type: "string", format: "date", title: "Applicant Date of Birth" },
        applicantNationality: { type: "string", title: "Applicant Nationality" },
        marriageDate: { type: "string", format: "date", title: "Marriage Date (if applicable)" },
        income: { type: "number", title: "Annual Income (CAD)", minimum: 0 },
        dependents: { type: "integer", title: "Number of Dependents", minimum: 0 },
        previousApplications: { type: "string", title: "Previous Immigration Applications" }
      },
      required: ["sponsorName", "sponsorEmail", "sponsorStatus", "relationship", "applicantName", "applicantDOB", "applicantNationality", "income", "dependents"]
    },
    uiSchema: {
      previousApplications: { "ui:widget": "textarea" }
    }
  },
  {
    id: 'study-permit',
    name: 'Study Permit Application',
    slug: 'study-permit',
    description: 'Initial assessment for study permit applications',
    fieldSchema: {
      type: "object",
      properties: {
        fullName: { type: "string", title: "Full Name" },
        email: { type: "string", format: "email", title: "Email Address" },
        dateOfBirth: { type: "string", format: "date", title: "Date of Birth" },
        nationality: { type: "string", title: "Nationality" },
        currentCountry: { type: "string", title: "Country of Residence" },
        educationLevel: {
          type: "string",
          title: "Current Education Level",
          enum: ["High School", "College", "University Undergraduate", "University Graduate"]
        },
        intendedProgram: { type: "string", title: "Intended Program of Study" },
        institution: { type: "string", title: "Preferred Institution" },
        startDate: { type: "string", format: "date", title: "Intended Start Date" },
        programDuration: {
          type: "string",
          title: "Program Duration",
          enum: ["Less than 6 months", "6 months to 1 year", "1-2 years", "2-3 years", "3+ years"]
        },
        financialSupport: {
          type: "string",
          title: "Financial Support",
          enum: ["Self-funded", "Family support", "Scholarship", "Government funding", "Other"]
        },
        englishProficiency: {
          type: "string",
          title: "English Proficiency Test",
          enum: ["IELTS", "TOEFL", "Not taken yet", "Not required"]
        }
      },
      required: ["fullName", "email", "dateOfBirth", "nationality", "currentCountry", "educationLevel", "intendedProgram", "startDate", "programDuration", "financialSupport", "englishProficiency"]
    },
    uiSchema: {}
  }
];

async function main() {
  console.log('🚀 Seeding production database...');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Check if templates already exist
    const existingCount = await prisma.formTemplate.count();
    console.log(`📊 Current template count: ${existingCount}`);

    // Seed templates
    for (const template of templates) {
      const created = await prisma.formTemplate.upsert({
        where: { slug: template.slug },
        update: {
          name: template.name,
          description: template.description,
          fieldSchema: template.fieldSchema,
          uiSchema: template.uiSchema,
          isActive: true,
        },
        create: {
          id: template.id,
          name: template.name,
          slug: template.slug,
          description: template.description,
          fieldSchema: template.fieldSchema,
          uiSchema: template.uiSchema,
          version: 1,
          isActive: true,
        },
      });

      console.log(`✅ Template: ${created.name}`);
    }

    // Verify seeding
    const finalCount = await prisma.formTemplate.count();
    console.log(`🎉 Seeding completed! Total templates: ${finalCount}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();