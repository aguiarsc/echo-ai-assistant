import { NextRequest } from 'next/server';
import { ApiKeyService } from '@/infrastructure/api-routes';

export async function GET(request: NextRequest) {
  return ApiKeyService.fetchApiKey(request);
}
