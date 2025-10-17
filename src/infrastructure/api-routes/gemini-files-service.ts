import { NextRequest, NextResponse } from 'next/server';
import { createGeminiClient } from '@/domains/conversations/types/conversation.types';
import { GeminiFilesApi } from '@/infrastructure/ai-integration/files-api';
import { createErrorResponse } from '@/infrastructure/api-client/http-client';

export class GeminiFilesService {
  private static getApiKey(request: NextRequest): string | undefined {
    return request.cookies.get('gemini_api_key')?.value;
  }

  private static validateApiKey(apiKey: string | undefined): NextResponse | null {
    if (!apiKey) {
      return createErrorResponse(
        'Missing Gemini API key. Please set it in the application settings.',
        401,
        'API_KEY_MISSING'
      );
    }
    return null;
  }

  static async uploadFile(req: NextRequest): Promise<NextResponse> {
    try {
      const apiKey = this.getApiKey(req);
      const validationError = this.validateApiKey(apiKey);
      if (validationError) return validationError;

      const genAI = createGeminiClient(apiKey!);
      const filesApi = new GeminiFilesApi(genAI);

      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const mimeType = formData.get('mimeType') as string | null;

      if (!file) {
        return createErrorResponse('No file provided.', 400, 'FILE_MISSING');
      }

      const fileMetadata = await filesApi.uploadFile({
        file,
        mimeType: mimeType || file.type
      });

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

  static async listFiles(req: NextRequest): Promise<NextResponse> {
    try {
      const apiKey = this.getApiKey(req);
      const validationError = this.validateApiKey(apiKey);
      if (validationError) return validationError;

      const genAI = createGeminiClient(apiKey!);
      const filesApi = new GeminiFilesApi(genAI);

      const url = new URL(req.url);
      const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
      const pageToken = url.searchParams.get('pageToken') || undefined;

      const filesResponse = await filesApi.listFiles(pageSize, pageToken);
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

  static async deleteFile(req: NextRequest): Promise<NextResponse> {
    try {
      const apiKey = this.getApiKey(req);
      const validationError = this.validateApiKey(apiKey);
      if (validationError) return validationError;

      const url = new URL(req.url);
      const fileName = url.searchParams.get('name');
      
      if (!fileName) {
        return createErrorResponse('Missing file name.', 400, 'FILE_NAME_MISSING');
      }

      const genAI = createGeminiClient(apiKey!);
      const filesApi = new GeminiFilesApi(genAI);

      await filesApi.deleteFile(fileName);
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

  static async getFileMetadata(req: NextRequest): Promise<NextResponse> {
    try {
      const apiKey = this.getApiKey(req);
      const validationError = this.validateApiKey(apiKey);
      if (validationError) return validationError;

      const url = new URL(req.url);
      const fileName = url.searchParams.get('name');
      
      if (!fileName) {
        return createErrorResponse('Missing file name.', 400, 'FILE_NAME_MISSING');
      }

      const genAI = createGeminiClient(apiKey!);
      const filesApi = new GeminiFilesApi(genAI);

      const fileMetadata = await filesApi.getFileMetadata(fileName);
      return NextResponse.json(fileMetadata);
    } catch (error) {
      console.error('File metadata error:', error);
      return createErrorResponse(
        `Failed to get file metadata: ${(error as Error).message}`,
        500,
        'GET_METADATA_FAILED'
      );
    }
  }
}
