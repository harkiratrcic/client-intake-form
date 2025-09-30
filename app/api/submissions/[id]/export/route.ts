import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../../../lib/auth/get-session';
import { getSubmissionById } from '../../../../../lib/services/submission-query-service';
import { generateSingleSubmissionCsv } from '../../../../../lib/services/export-service';
import { ExportOptions } from '../../../../../lib/services/export-service';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session || !session.owner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { searchParams } = new URL(request.url);

    // Parse export options
    const includeMetadata = searchParams.get('includeMetadata') !== 'false';
    const includeFormData = searchParams.get('includeFormData') !== 'false';
    const dateFormat = searchParams.get('dateFormat') === 'iso' ? 'iso' : 'localized';

    const exportOptions: ExportOptions = {
      includeMetadata,
      includeFormData,
      dateFormat,
    };

    // Get the specific submission
    const submission = await getSubmissionById(id, session.owner.id);
    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Generate CSV for single submission
    const csvResult = generateSingleSubmissionCsv(submission, exportOptions);

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
    console.error('Single submission export API error:', error);
    return NextResponse.json(
      { error: 'Failed to export submission' },
      { status: 500 }
    );
  }
}