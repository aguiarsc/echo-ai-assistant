import { NextResponse } from 'next/server';

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}

export function createErrorResponse(
  message: string,
  status: number,
  code?: string
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
      },
    },
    { status }
  );
}
