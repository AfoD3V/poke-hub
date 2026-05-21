import { proxyGet } from '@/lib/apiProxy';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return proxyGet('/api/cards/by-set', req.nextUrl.searchParams);
}
