import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { getSession } from '../../../../lib/auth/get-session';
import { getSubmissionById } from '../../../../lib/services/submission-query-service';
import { SubmissionViewer } from '../../../../components/dashboard/submission-viewer';
import { prisma } from '../../../../lib/db/prisma';

interface SubmissionDetailPageProps {
  params: {
    id: string;
  };
}

export default async function SubmissionDetailPage({
  params,
}: SubmissionDetailPageProps) {
  // Get session for owner ID
  const session = await getSession();
  if (!session || !session.owner) {
    redirect('/login');
  }

  const ownerId = session.owner.id;

  // Fetch submission with template schema
  const submission = await getSubmissionById(params.id, ownerId);

  if (!submission) {
    notFound();
  }

  // Get full template schema for proper field rendering
  const submissionWithSchema = await prisma.submission.findFirst({
    where: {
      id: params.id,
      formInstance: {
        ownerId,
      },
    },
    include: {
      formInstance: {
        include: {
          template: {
            select: {
              name: true,
              category: true,
              schema: true,
            },
          },
        },
      },
    },
  });

  // Combine submission data with schema information
  const enrichedSubmission = {
    ...submission,
    formInstance: submissionWithSchema?.formInstance,
  };

  return <SubmissionViewer submission={enrichedSubmission} />;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  // Get session for owner ID
  const session = await getSession();
  if (!session || !session.owner) {
    return {
      title: 'Submission Details - FormFlow Dashboard',
      description: 'View detailed form submission information.',
    };
  }

  const submission = await getSubmissionById(params.id, session.owner.id);

  if (!submission) {
    return {
      title: 'Submission Not Found - FormFlow Dashboard',
      description: 'The requested submission could not be found.',
    };
  }

  return {
    title: `${submission.formTitle} - ${submission.clientName} | FormFlow Dashboard`,
    description: `View submission details for ${submission.formTitle} submitted by ${submission.clientName}.`,
  };
}