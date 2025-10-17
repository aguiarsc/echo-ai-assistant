import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'gemini_api_key';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export class ApiKeyService {
  static checkApiKeyStatus(request: NextRequest): NextResponse {
    const hasApiKey = request.cookies.has(COOKIE_NAME);
    return NextResponse.json({ success: true, hasApiKey });
  }

  static async storeApiKey(request: NextRequest): Promise<NextResponse> {
    try {
      const { apiKey } = await request.json();
      
      if (!apiKey || typeof apiKey !== 'string') {
        return NextResponse.json(
          { success: false, message: 'API key is required' },
          { status: 400 }
        );
      }
      
      const response = NextResponse.json({ 
        success: true, 
        message: 'API key stored successfully' 
      });
      
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

  static removeApiKey(): NextResponse {
    const response = NextResponse.json({ 
      success: true, 
      message: 'API key removed successfully' 
    });
    
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  static fetchApiKey(request: NextRequest): NextResponse {
    const apiKeyCookie = request.cookies.get(COOKIE_NAME);
    const apiKey = apiKeyCookie?.value || '';
    return NextResponse.json({ apiKey });
  }
}
