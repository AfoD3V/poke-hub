import { proxyGet } from '@/lib/apiProxy';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return proxyGet('/api/cards/search', req.nextUrl.searchParams);
}
