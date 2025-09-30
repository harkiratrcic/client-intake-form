import { NextRequest, NextResponse } from 'next/server';
import { saveDraft, getDraft } from '../../../../../lib/services/draft-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const draftData = await request.json();

    // Save draft using service
    const result = await saveDraft(token, draftData);

    if (!result.success) {
      const status = result.error === 'Form not found' ? 404 :
                    result.error === 'Form has expired' ? 400 :
                    result.error === 'Form has already been submitted' ? 400 : 500;

      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      lastSavedAt: result.lastSavedAt,
      message: 'Draft saved successfully',
    });

  } catch (error) {
    console.error('Error saving draft:', error);

    // Check if it's a validation error
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Get draft using service
    const result = await getDraft(token);

    if (result.error) {
      const status = result.error === 'Form not found' ? 404 :
                    result.error === 'Form has expired' ? 400 : 500;

      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }

    return NextResponse.json({
      draftData: result.draftData,
      lastSavedAt: result.lastSavedAt,
      status: result.status,
    });

  } catch (error) {
    console.error('Error retrieving draft:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}