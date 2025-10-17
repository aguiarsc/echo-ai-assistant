import { NextRequest } from 'next/server';
import { GeminiFilesService } from '@/infrastructure/api-routes';

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return GeminiFilesService.uploadFile(req);
}
