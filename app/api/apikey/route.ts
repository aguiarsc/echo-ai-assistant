import { NextRequest } from 'next/server';
import { ApiKeyService } from '@/infrastructure/api-routes';

export async function GET(request: NextRequest) {
  return ApiKeyService.checkApiKeyStatus(request);
}

export async function POST(request: NextRequest) {
  return ApiKeyService.storeApiKey(request);
}

export async function DELETE() {
  return ApiKeyService.removeApiKey();
}
