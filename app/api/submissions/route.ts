import { NextRequest, NextResponse } from 'next/server';
import { getSubmissionsForOwner } from '../../../lib/services/submission-query-service-fixed';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated owner ID from middleware-set header
    const ownerId = request.headers.get('x-owner-id');
    if (!ownerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') as 'submittedAt' | 'clientEmail' | 'formTitle' | undefined;
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;

    // Parse date filters
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (startDateParam) {
      startDate = new Date(startDateParam);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid start date format' },
          { status: 400 }
        );
      }
    }

    if (endDateParam) {
      endDate = new Date(endDateParam);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end date format' },
          { status: 400 }
        );
      }
      // Set end date to end of day
      endDate.setHours(23, 59, 59, 999);
    }

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Fetch submissions
    const result = await getSubmissionsForOwner(ownerId, {
      page,
      limit,
      search,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}