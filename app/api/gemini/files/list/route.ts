import { NextRequest } from 'next/server';
import { GeminiFilesService } from '@/infrastructure/api-routes';

export async function GET(req: NextRequest) {
  return GeminiFilesService.listFiles(req);
}
