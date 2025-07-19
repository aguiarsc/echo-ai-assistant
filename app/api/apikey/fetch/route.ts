import { NextRequest, NextResponse } from 'next/server';

// Constants for cookie configuration
const COOKIE_NAME = 'gemini_api_key';

/**
 * GET handler to retrieve the API key for server-side operations
 * This is a protected endpoint that should only be called server-side
 */
export async function GET(request: NextRequest) {
  // Extract the API key from cookies
  const apiKeyCookie = request.cookies.get(COOKIE_NAME);
  const apiKey = apiKeyCookie?.value || '';
  
  // Only return the actual key to server components
  return NextResponse.json({ 
    apiKey
  });
}
