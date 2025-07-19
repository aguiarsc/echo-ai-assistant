import { NextRequest, NextResponse } from 'next/server';

// Constants for cookie configuration
const COOKIE_NAME = 'gemini_api_key';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * GET handler to retrieve API key status (not the actual key for security)
 */
export async function GET(request: NextRequest) {
  // Check if the cookie exists
  const hasApiKey = request.cookies.has(COOKIE_NAME);
  
  return NextResponse.json({ 
    success: true, 
    hasApiKey 
  });
}

/**
 * POST handler to set a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();
    
    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { success: false, message: 'API key is required' },
        { status: 400 }
      );
    }
    
    // Create a new response object
    const response = NextResponse.json({ 
      success: true, 
      message: 'API key stored successfully' 
    });
    
    // Set HTTP-only cookie with the API key
    response.cookies.set({
      name: COOKIE_NAME,
      value: apiKey,
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'strict',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });
    
    return response;
  } catch (error) {
    console.error('Error setting API key:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save API key' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler to remove the stored API key
 */
export async function DELETE(request: NextRequest) {
  // Create a response and clear the cookie
  const response = NextResponse.json({ 
    success: true, 
    message: 'API key removed successfully' 
  });
  
  // Delete the cookie by setting it with maxAge=0
  response.cookies.delete(COOKIE_NAME);
  
  return response;
}
