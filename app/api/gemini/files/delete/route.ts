import { NextRequest } from 'next/server';
import { GeminiFilesService } from '@/infrastructure/api-routes';

export async function DELETE(req: NextRequest) {
  return GeminiFilesService.deleteFile(req);
}
