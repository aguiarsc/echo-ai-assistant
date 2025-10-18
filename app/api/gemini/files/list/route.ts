import { NextRequest, NextResponse } from 'next/server';
import { createGeminiClient } from '@/lib/ai/gemini/services/gemini-client.service';
import { GeminiFilesService } from '@/lib/ai/gemini/services/gemini-files.service';
import { createErrorResponse } from '@/lib/api/helpers';

export async function GET(req: NextRequest) {
  try {
    // Get API key from the secure cookie
    const apiKey = req.cookies.get('gemini_api_key')?.value;
    
    if (!apiKey) {
      return createErrorResponse(
        'Missing Gemini API key. Please set it in the application settings.',
        401,
        'API_KEY_MISSING'
      );
    }

    // Initialize Gemini client and Files API
    const genAI = createGeminiClient(apiKey);
    const filesApi = new GeminiFilesService(genAI);

    // Get query parameters
    const url = new URL(req.url);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const pageToken = url.searchParams.get('pageToken') || undefined;

    // List files from Gemini API
    const filesResponse = await filesApi.listFiles(pageSize, pageToken);

    // Return file list to client
    return NextResponse.json(filesResponse);
  } catch (error) {
    console.error('File listing error:', error);
    return createErrorResponse(
      `Failed to list files: ${(error as Error).message}`,
      500,
      'LIST_FILES_FAILED'
    );
  }
}
