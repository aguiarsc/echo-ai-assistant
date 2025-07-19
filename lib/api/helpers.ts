import { NextResponse } from 'next/server';

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}

/**
 * Creates a standardized error response.
 * @param message The error message.
 * @param status The HTTP status code.
 * @param code An optional error code.
 * @returns A NextResponse object with the standardized error format.
 */
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
