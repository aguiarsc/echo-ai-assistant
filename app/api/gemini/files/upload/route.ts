import { NextRequest, NextResponse } from 'next/server';
import { createGeminiClient } from '@/lib/gemini';
import { GeminiFilesApi } from '@/lib/gemini/files-api';
import { createErrorResponse } from '@/lib/api/helpers';

export const runtime = "nodejs";

// File upload API handler
export async function POST(req: NextRequest) {
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
    const filesApi = new GeminiFilesApi(genAI);

    // Parse the form data with the file
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const mimeType = formData.get('mimeType') as string | null;

    if (!file) {
      return createErrorResponse('No file provided.', 400, 'FILE_MISSING');
    }

    // Upload file to Gemini API
    const fileMetadata = await filesApi.uploadFile({
      file,
      mimeType: mimeType || file.type
    });

    // Return file metadata to client
    return NextResponse.json(fileMetadata);
  } catch (error) {
    console.error('File upload error:', error);
    return createErrorResponse(
      `File upload failed: ${(error as Error).message}`,
      500,
      'UPLOAD_FAILED'
    );
  }
}
