import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  {
    id: 'visitor-visa-imm5257',
    name: 'Visitor Visa (IMM 5257)',
    slug: 'visitor-visa-imm5257',
    description: 'Application for Temporary Resident Visa - Complete intake form for visitor visa applications',
    fieldSchema: {
      type: "object",
      properties: {
        // Personal Information
        fullName: { type: "string", title: "Full name (as shown in passport)" },
        aliases: { type: "string", title: "Have you ever used another name? (aliases, maiden name, nicknames)" },
        sex: { type: "string", title: "Sex", enum: ["Male", "Female"] },
        dateOfBirth: { type: "string", format: "date", title: "Date of birth" },
        placeOfBirth: { type: "string", title: "Place of birth (city, country)" },
        countryOfCitizenship: { type: "string", title: "Country of citizenship" },

        // Current & Previous Residence
        currentCountry: { type: "string", title: "Current country of residence" },
        currentStatus: { type: "string", title: "Current immigration status" },
        currentFrom: { type: "string", format: "date", title: "Current residence from date" },
        currentTo: { type: "string", format: "date", title: "Current residence to date" },
        previousCountry: { type: "string", title: "Previous country of residence" },
        previousStatus: { type: "string", title: "Previous immigration status" },
        previousFrom: { type: "string", format: "date", title: "Previous residence from date" },
        previousTo: { type: "string", format: "date", title: "Previous residence to date" },

        // Marital Status
        maritalStatus: {
          type: "string",
          title: "Marital status",
          enum: ["Single", "Married", "Common-law", "Divorced", "Widowed", "Separated"]
        },
        previousMarriage: { type: "string", title: "Have you been married/common-law before? (details)" },

        // Passport
        passportNumber: { type: "string", title: "Passport number" },
        passportCountry: { type: "string", title: "Country of issue" },
        passportIssueDate: { type: "string", format: "date", title: "Passport issue date" },
        passportExpiryDate: { type: "string", format: "date", title: "Passport expiry date" },

        // Contact Information
        mailingAddress: { type: "string", title: "Current mailing address" },
        residentialAddress: { type: "string", title: "Residential address (if different)" },
        phone: { type: "string", title: "Telephone number" },
        email: { type: "string", format: "email", title: "Email address" },

        // Details of Visit
        purposeOfVisit: { type: "string", title: "Purpose of visit" },
        arrivalDate: { type: "string", format: "date", title: "Date of arrival in Canada" },
        durationOfStay: { type: "string", title: "Duration of stay" },
        fundsAvailable: { type: "number", title: "Funds available for stay (CAD)" },
        previousCanadaApplication: { type: "string", title: "Have you previously applied to enter/remain in Canada? (details)" },

        // Background Information
        medicalTB: { type: "string", title: "Medical: Tuberculosis or close contact with TB?", enum: ["Yes", "No"] },
        medicalOther: { type: "string", title: "Any other disorders/disease?" },
        criminalHistory: { type: "string", title: "Ever arrested, charged, convicted, refused entry, or deported?", enum: ["Yes", "No"] },
        criminalDetails: { type: "string", title: "If yes, provide details" },
        militaryService: { type: "string", title: "Military service details" },
      },
      required: ["fullName", "sex", "dateOfBirth", "placeOfBirth", "countryOfCitizenship", "currentCountry", "maritalStatus", "passportNumber", "passportCountry", "passportIssueDate", "passportExpiryDate", "mailingAddress", "phone", "email", "purposeOfVisit", "arrivalDate", "durationOfStay", "medicalTB", "criminalHistory"]
    },
    uiSchema: {
      aliases: { "ui:widget": "textarea" },
      previousMarriage: { "ui:widget": "textarea" },
      mailingAddress: { "ui:widget": "textarea" },
      residentialAddress: { "ui:widget": "textarea" },
      previousCanadaApplication: { "ui:widget": "textarea" },
      medicalOther: { "ui:widget": "textarea" },
      criminalDetails: { "ui:widget": "textarea" },
      militaryService: { "ui:widget": "textarea" }
    }
  },
  {
    id: 'express-entry-pr',
    name: 'Express Entry (Permanent Residence)',
    slug: 'express-entry-pr',
    description: 'Complete Express Entry application including IMM 0008, IMM 5406, and IMM 5669',
    fieldSchema: {
      type: "object",
      properties: {
        // Generic Application (IMM 0008)
        fullName: { type: "string", title: "Full legal name" },
        uci: { type: "string", title: "UCI (if applicable)" },
        sex: { type: "string", title: "Sex", enum: ["Male", "Female"] },
        maritalStatus: { type: "string", title: "Marital status", enum: ["Single", "Married", "Common-law", "Divorced", "Widowed", "Separated"] },
        dateOfBirth: { type: "string", format: "date", title: "Date of birth" },
        placeOfBirth: { type: "string", title: "Place of birth (city, country)" },
        countryOfCitizenship: { type: "string", title: "Country of citizenship" },

        // Immigration Office
        immigrationOffice: { type: "string", title: "Immigration office requested for processing" },

        // Language
        correspondenceLanguage: { type: "string", title: "Language preference for correspondence", enum: ["English", "French"] },
        interpreterNeeded: { type: "string", title: "Do you need an interpreter?", enum: ["Yes", "No"] },
        interpreterLanguage: { type: "string", title: "If yes, what language?" },

        // Contact Info
        mailingAddress: { type: "string", title: "Current mailing address" },
        residentialAddress: { type: "string", title: "Residential address (if different)" },
        phone: { type: "string", title: "Telephone number" },
        email: { type: "string", format: "email", title: "Email address" },

        // Immigration History
        previousPermitsVisas: { type: "string", title: "Previous Canadian permits or visas" },
        previousRefusals: { type: "string", title: "Previous visa refusals or removals" },

        // Personal History (10 years) - Array field
        personalHistory: {
          type: "array",
          title: "Personal history for last 10 years (employment, unemployment, study, addresses - no gaps)",
          items: {
            type: "object",
            properties: {
              activity: { type: "string", title: "Activity (Employment/Study/Unemployed)" },
              employer: { type: "string", title: "Employer/Institution name" },
              position: { type: "string", title: "Position/Field of study" },
              address: { type: "string", title: "Address during this period" },
              fromDate: { type: "string", format: "date", title: "From" },
              toDate: { type: "string", format: "date", title: "To" }
            },
            required: ["activity", "fromDate", "toDate"]
          },
          minItems: 1
        },

        // Work Experience - Array field
        workExperience: {
          type: "array",
          title: "Employment history",
          items: {
            type: "object",
            properties: {
              nocCode: { type: "string", title: "NOC code" },
              jobTitle: { type: "string", title: "Job title" },
              employer: { type: "string", title: "Employer name" },
              employerAddress: { type: "string", title: "Employer address" },
              duties: { type: "string", title: "Main duties and responsibilities" },
              fromDate: { type: "string", format: "date", title: "From" },
              toDate: { type: "string", format: "date", title: "To" }
            },
            required: ["jobTitle", "employer", "fromDate", "toDate"]
          },
          minItems: 1
        },

        // Education
        education: {
          type: "array",
          title: "Education credentials",
          items: {
            type: "object",
            properties: {
              level: { type: "string", title: "Level of education" },
              fieldOfStudy: { type: "string", title: "Field of study" },
              institution: { type: "string", title: "School/Institution name" },
              fromDate: { type: "string", format: "date", title: "From" },
              toDate: { type: "string", format: "date", title: "To" }
            },
            required: ["level", "fieldOfStudy", "institution", "fromDate", "toDate"]
          },
          minItems: 1
        },

        // Additional Info
        membershipAssociations: { type: "string", title: "Membership in political, social organizations, or professional associations" },
        governmentPositions: { type: "string", title: "Government positions held (military, civil service, police)" },
        criminalConvictions: { type: "string", title: "Criminal charges or convictions" },
        warCrimes: { type: "string", title: "War crimes, crimes against humanity, or military service in conflict areas" },

        // Language Tests
        englishTest: { type: "string", title: "English language test (IELTS/CELPIP)" },
        frenchTest: { type: "string", title: "French language test (TEF/TCF)" },

        // Proof of Funds
        proofOfFunds: { type: "number", title: "Proof of funds (CAD)" },

        // Education Credential Assessment
        eca: { type: "string", title: "Educational Credential Assessment (if required)" },

        // Provincial Nomination
        provincialNomination: { type: "string", title: "Provincial nomination (if applicable)" },

        // Family Information (IMM 5406)
        parents: {
          type: "array",
          title: "Parents information",
          items: {
            type: "object",
            properties: {
              name: { type: "string", title: "Full name" },
              dateOfBirth: { type: "string", format: "date", title: "Date of birth" },
              address: { type: "string", title: "Present address" }
            },
            required: ["name"]
          },
          maxItems: 2
        },

        children: {
          type: "array",
          title: "Children information",
          items: {
            type: "object",
            properties: {
              name: { type: "string", title: "Full name" },
              dateOfBirth: { type: "string", format: "date", title: "Date of birth" },
              maritalStatus: { type: "string", title: "Marital status" },
              address: { type: "string", title: "Present address" }
            },
            required: ["name"]
          }
        },

        siblings: {
          type: "array",
          title: "Siblings information",
          items: {
            type: "object",
            properties: {
              name: { type: "string", title: "Full name" },
              dateOfBirth: { type: "string", format: "date", title: "Date of birth" },
              maritalStatus: { type: "string", title: "Marital status" },
              address: { type: "string", title: "Present address" }
            },
            required: ["name"]
          }
        }
      },
      required: ["fullName", "sex", "maritalStatus", "dateOfBirth", "placeOfBirth", "countryOfCitizenship", "correspondenceLanguage", "email", "phone", "personalHistory", "workExperience", "education"]
    },
    uiSchema: {
      previousPermitsVisas: { "ui:widget": "textarea" },
      previousRefusals: { "ui:widget": "textarea" },
      membershipAssociations: { "ui:widget": "textarea" },
      governmentPositions: { "ui:widget": "textarea" },
      criminalConvictions: { "ui:widget": "textarea" },
      warCrimes: { "ui:widget": "textarea" },
      personalHistory: {
        items: {
          address: { "ui:widget": "textarea" }
        }
      },
      workExperience: {
        items: {
          employerAddress: { "ui:widget": "textarea" },
          duties: { "ui:widget": "textarea" }
        }
      }
    }
  },
  {
    id: 'family-sponsorship-complete',
    name: 'Family Sponsorship (Complete)',
    slug: 'family-sponsorship-complete',
    description: 'Complete family sponsorship application including IMM 1344, IMM 0008, IMM 5406, and IMM 5669',
    fieldSchema: {
      type: "object",
      properties: {
        // Sponsorship Application (IMM 1344)
        sponsorFullName: { type: "string", title: "Sponsor full name" },
        sponsorDOB: { type: "string", format: "date", title: "Sponsor date of birth" },
        sponsorAddress: { type: "string", title: "Sponsor address in Canada" },
        sponsorStatus: { type: "string", title: "Sponsor status in Canada", enum: ["Canadian Citizen", "Permanent Resident"] },

        // Relationship
        relationshipToPrincipal: { type: "string", title: "Relationship to principal applicant", enum: ["Spouse", "Common-law partner", "Conjugal partner", "Dependent child", "Parent", "Grandparent", "Other"] },
        numberOfPersonsSponsored: { type: "integer", title: "Number of persons being sponsored", minimum: 1 },

        // Co-signer
        coSigner: { type: "string", title: "Co-signer information (if spouse/common-law)", enum: ["Yes", "No"] },
        coSignerName: { type: "string", title: "Co-signer full name" },

        // Eligibility Questions
        receivingSocialAssistance: { type: "string", title: "Are you receiving social assistance?", enum: ["Yes", "No"] },
        previousSponsorships: { type: "string", title: "Previous sponsorship undertakings" },
        bankruptcy: { type: "string", title: "Have you declared bankruptcy?", enum: ["Yes", "No"] },
        defaultedSupport: { type: "string", title: "Defaulted on loans or support payments?", enum: ["Yes", "No"] },
        sponsorCriminality: { type: "string", title: "Criminal convictions", enum: ["Yes", "No"] },
        sponsorCriminalityDetails: { type: "string", title: "If yes, provide details" },

        // Principal Applicant (IMM 0008)
        applicantFullName: { type: "string", title: "Principal applicant full name" },
        applicantUCI: { type: "string", title: "UCI (if applicable)" },
        applicantSex: { type: "string", title: "Sex", enum: ["Male", "Female"] },
        applicantDOB: { type: "string", format: "date", title: "Date of birth" },
        applicantPlaceOfBirth: { type: "string", title: "Place of birth (city, country)" },
        applicantCitizenship: { type: "string", title: "Country of citizenship" },
        applicantMaritalStatus: { type: "string", title: "Marital status", enum: ["Single", "Married", "Common-law", "Divorced", "Widowed", "Separated"] },

        // Contact
        applicantEmail: { type: "string", format: "email", title: "Applicant email address" },
        applicantPhone: { type: "string", title: "Applicant telephone number" },
        applicantAddress: { type: "string", title: "Applicant current address" },

        // Personal History (10 years)
        personalHistory: {
          type: "array",
          title: "Applicant personal history for last 10 years (no gaps)",
          items: {
            type: "object",
            properties: {
              activity: { type: "string", title: "Activity (Employment/Study/Unemployed)" },
              employer: { type: "string", title: "Employer/Institution name" },
              position: { type: "string", title: "Position/Field of study" },
              address: { type: "string", title: "Address during this period" },
              fromDate: { type: "string", format: "date", title: "From" },
              toDate: { type: "string", format: "date", title: "To" }
            },
            required: ["activity", "address", "fromDate", "toDate"]
          },
          minItems: 1
        },

        // Background
        membershipAssociations: { type: "string", title: "Membership in organizations" },
        governmentPositions: { type: "string", title: "Government positions held" },
        criminalConvictions: { type: "string", title: "Criminal charges or convictions" },

        // Family Information (IMM 5406)
        applicantParents: {
          type: "array",
          title: "Applicant's parents",
          items: {
            type: "object",
            properties: {
              name: { type: "string", title: "Full name" },
              dateOfBirth: { type: "string", format: "date", title: "Date of birth" },
              address: { type: "string", title: "Present address" }
            },
            required: ["name"]
          },
          maxItems: 2
        },

        applicantChildren: {
          type: "array",
          title: "Applicant's children",
          items: {
            type: "object",
            properties: {
              name: { type: "string", title: "Full name" },
              dateOfBirth: { type: "string", format: "date", title: "Date of birth" },
              maritalStatus: { type: "string", title: "Marital status" },
              address: { type: "string", title: "Present address" }
            },
            required: ["name"]
          }
        },

        applicantSiblings: {
          type: "array",
          title: "Applicant's siblings",
          items: {
            type: "object",
            properties: {
              name: { type: "string", title: "Full name" },
              dateOfBirth: { type: "string", format: "date", title: "Date of birth" },
              maritalStatus: { type: "string", title: "Marital status" },
              address: { type: "string", title: "Present address" }
            },
            required: ["name"]
          }
        }
      },
      required: ["sponsorFullName", "sponsorDOB", "sponsorAddress", "sponsorStatus", "relationshipToPrincipal", "numberOfPersonsSponsored", "receivingSocialAssistance", "bankruptcy", "defaultedSupport", "sponsorCriminality", "applicantFullName", "applicantDOB", "applicantPlaceOfBirth", "applicantCitizenship", "applicantMaritalStatus", "applicantEmail", "applicantPhone", "personalHistory"]
    },
    uiSchema: {
      sponsorAddress: { "ui:widget": "textarea" },
      previousSponsorships: { "ui:widget": "textarea" },
      sponsorCriminalityDetails: { "ui:widget": "textarea" },
      applicantAddress: { "ui:widget": "textarea" },
      membershipAssociations: { "ui:widget": "textarea" },
      governmentPositions: { "ui:widget": "textarea" },
      criminalConvictions: { "ui:widget": "textarea" },
      personalHistory: {
        items: {
          address: { "ui:widget": "textarea" }
        }
      }
    }
  },
  {
    id: 'work-permit-extension-imm5710',
    name: 'Work Permit Extension (IMM 5710)',
    slug: 'work-permit-extension-imm5710',
    description: 'Application to Change Conditions, Extend Stay or Remain in Canada as a Worker',
    fieldSchema: {
      type: "object",
      properties: {
        // Personal Information
        fullName: { type: "string", title: "Full name" },
        uci: { type: "string", title: "UCI (if applicable)" },
        sex: { type: "string", title: "Sex", enum: ["Male", "Female"] },
        dateOfBirth: { type: "string", format: "date", title: "Date of birth" },
        placeOfBirth: { type: "string", title: "Place of birth (city, country)" },
        countryOfCitizenship: { type: "string", title: "Country of citizenship" },
        currentCountry: { type: "string", title: "Current country of residence" },
        currentStatus: { type: "string", title: "Current immigration status in country of residence" },

        // Passport
        passportNumber: { type: "string", title: "Passport number" },
        passportCountry: { type: "string", title: "Country of passport issue" },
        passportIssueDate: { type: "string", format: "date", title: "Passport issue date" },
        passportExpiryDate: { type: "string", format: "date", title: "Passport expiry date" },
        nationalIdDocument: { type: "string", title: "National identity document (if applicable)" },

        // Contact Information
        mailingAddress: { type: "string", title: "Current mailing address" },
        residentialAddress: { type: "string", title: "Residential address in Canada (if different)" },
        phone: { type: "string", title: "Telephone number" },
        email: { type: "string", format: "email", title: "Email address" },

        // Application Type
        applicationType: {
          type: "array",
          title: "I am applying for one or more of the following",
          items: {
            type: "string",
            enum: ["Extend my work permit", "Initial work permit from within Canada", "Restoration of status as a worker"]
          },
          uniqueItems: true,
          minItems: 1
        },

        // Intended Work Details
        employerName: { type: "string", title: "Name of employer" },
        employerAddress: { type: "string", title: "Employer address in Canada" },
        jobTitle: { type: "string", title: "Job title" },
        nocCode: { type: "string", title: "NOC code" },
        workDuration: { type: "string", title: "Duration of expected work" },
        workStartDate: { type: "string", format: "date", title: "Expected start date" },
        workEndDate: { type: "string", format: "date", title: "Expected end date" },

        // LMIA/Offer of Employment
        lmiaNumber: { type: "string", title: "LMIA number (if applicable)" },
        offerOfEmploymentNumber: { type: "string", title: "Offer of employment number" },
        complianceFeePaid: { type: "string", title: "Has employer paid compliance fee?", enum: ["Yes", "No", "Not applicable"] },
        lmiaExempt: { type: "string", title: "Is this work permit LMIA-exempt?", enum: ["Yes", "No"] },
        lmiaExemptCode: { type: "string", title: "If LMIA-exempt, provide exemption code" },

        // Education History
        highestEducation: { type: "string", title: "Highest level of post-secondary education" },
        fieldOfStudy: { type: "string", title: "Field of study" },
        institution: { type: "string", title: "School/Institution name" },
        graduationDate: { type: "string", format: "date", title: "Graduation date" },

        // Employment History (last 10 years)
        employmentHistory: {
          type: "array",
          title: "Employment history for last 10 years",
          items: {
            type: "object",
            properties: {
              employer: { type: "string", title: "Employer name" },
              employerAddress: { type: "string", title: "Employer address" },
              occupation: { type: "string", title: "Occupation/Position" },
              fromDate: { type: "string", format: "date", title: "From" },
              toDate: { type: "string", format: "date", title: "To" }
            },
            required: ["employer", "occupation", "fromDate", "toDate"]
          },
          minItems: 1
        },

        // Background Information
        medicalTB: { type: "string", title: "Tuberculosis or close contact with TB?", enum: ["Yes", "No"] },
        medicalOther: { type: "string", title: "Any other medical disorders/disease?" },
        criminalHistory: { type: "string", title: "Ever arrested, charged, convicted, refused entry, or deported?", enum: ["Yes", "No"] },
        criminalDetails: { type: "string", title: "If yes, provide details" },
        previousRefusals: { type: "string", title: "Previous visa refusals or applications to Canada" }
      },
      required: ["fullName", "sex", "dateOfBirth", "placeOfBirth", "countryOfCitizenship", "passportNumber", "passportCountry", "passportIssueDate", "passportExpiryDate", "mailingAddress", "phone", "email", "applicationType", "employerName", "employerAddress", "jobTitle", "nocCode", "offerOfEmploymentNumber", "complianceFeePaid", "lmiaExempt", "highestEducation", "employmentHistory", "medicalTB", "criminalHistory"]
    },
    uiSchema: {
      mailingAddress: { "ui:widget": "textarea" },
      residentialAddress: { "ui:widget": "textarea" },
      employerAddress: { "ui:widget": "textarea" },
      medicalOther: { "ui:widget": "textarea" },
      criminalDetails: { "ui:widget": "textarea" },
      previousRefusals: { "ui:widget": "textarea" },
      employmentHistory: {
        items: {
          employerAddress: { "ui:widget": "textarea" }
        }
      }
    }
  }
];

async function main() {
  console.log('Seeding templates...');

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

    console.log(`✓ Template: ${created.name}`);
  }

  console.log('Template seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });