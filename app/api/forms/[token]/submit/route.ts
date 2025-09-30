import { NextRequest, NextResponse } from 'next/server';
import { submitForm } from '../../../../../lib/services/submission-service';

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

    const submissionData = await request.json();

    // Submit form using service
    const result = await submitForm(token, submissionData);

    if (!result.success) {
      const status = result.error === 'Form not found' ? 404 :
                    result.error === 'Form has expired' ? 400 :
                    result.error === 'Form has already been submitted' ? 400 :
                    result.error?.startsWith('Validation failed') ? 422 : 500;

      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      submissionId: result.submissionId,
      submittedAt: result.submittedAt,
      message: 'Form submitted successfully',
    });

  } catch (error) {
    console.error('Error submitting form:', error);

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