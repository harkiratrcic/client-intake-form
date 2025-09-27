import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../../lib/auth/get-session';
import { getSubmissionsForOwner } from '../../../../lib/services/submission-query-service';
import { generateSubmissionsCsv, generateFormFieldsSummary } from '../../../../lib/services/export-service';
import { ExportOptions } from '../../../../lib/services/export-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.owner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Parse export type
    const exportType = searchParams.get('type') || 'submissions';

    // Parse export options
    const includeMetadata = searchParams.get('includeMetadata') !== 'false';
    const includeFormData = searchParams.get('includeFormData') !== 'false';
    const dateFormat = searchParams.get('dateFormat') === 'iso' ? 'iso' : 'localized';
    const flattenData = searchParams.get('flattenData') !== 'false';

    const exportOptions: ExportOptions = {
      includeMetadata,
      includeFormData,
      dateFormat,
      flattenData,
    };

    // Parse query options for submissions
    const search = searchParams.get('search') || undefined;
    const formInstanceId = searchParams.get('formInstanceId') || undefined;
    const templateCategory = searchParams.get('templateCategory') || undefined;
    const status = searchParams.get('status') || undefined;

    // Parse date filters
    const submittedAfter = searchParams.get('submittedAfter')
      ? new Date(searchParams.get('submittedAfter')!)
      : undefined;
    const submittedBefore = searchParams.get('submittedBefore')
      ? new Date(searchParams.get('submittedBefore')!)
      : undefined;

    // Get submissions with filters but no pagination for export
    const submissionsResult = await getSubmissionsForOwner(session.owner.id, {
      search,
      formInstanceId,
      templateCategory,
      status: status as any,
      submittedAfter,
      submittedBefore,
      // No pagination - export all matching results
      page: 1,
      limit: 10000, // Large limit to get all results
    });

    let csvResult;

    if (exportType === 'fields-summary') {
      csvResult = generateFormFieldsSummary(submissionsResult.submissions);
    } else {
      csvResult = generateSubmissionsCsv(submissionsResult.submissions, exportOptions);
    }

    // Return CSV file
    return new NextResponse(csvResult.content, {
      status: 200,
      headers: {
        'Content-Type': csvResult.contentType,
        'Content-Disposition': `attachment; filename="${csvResult.filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Failed to export submissions' },
      { status: 500 }
    );
  }
}