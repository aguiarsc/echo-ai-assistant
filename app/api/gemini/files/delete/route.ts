import { NextRequest, NextResponse } from 'next/server';
import { createGeminiClient } from '@/lib/ai/gemini/services/gemini-client.service';
import { GeminiFilesService } from '@/lib/ai/gemini/services/gemini-files.service';
import { createErrorResponse } from '@/lib/api/helpers';

export async function DELETE(req: NextRequest) {
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

    // Get file name from URL params
    const url = new URL(req.url);
    const fileName = url.searchParams.get('name');
    
    if (!fileName) {
      return createErrorResponse('Missing file name.', 400, 'FILE_NAME_MISSING');
    }

    // Initialize Gemini client and Files API
    const genAI = createGeminiClient(apiKey);
    const filesApi = new GeminiFilesService(genAI);

    // Delete file from Gemini API
    await filesApi.deleteFile(fileName);

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('File deletion error:', error);
    return createErrorResponse(
      `Failed to delete file: ${(error as Error).message}`,
      500,
      'DELETION_FAILED'
    );
  }
}
