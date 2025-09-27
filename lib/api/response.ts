import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({
    success: true,
    ...data,
  }, { status });
}

export function errorResponse(error: string, status = 400, details?: any) {
  return NextResponse.json({
    success: false,
    error,
    ...(details && { details }),
  }, { status });
}

export function validationErrorResponse(error: ZodError) {
  return NextResponse.json({
    success: false,
    error: 'Validation failed',
    details: error.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  }, { status: 400 });
}

export function internalErrorResponse(error?: any) {
  console.error('Internal server error:', error);
  return NextResponse.json({
    success: false,
    error: 'Internal server error',
  }, { status: 500 });
}