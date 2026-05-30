import { proxyGet } from '@/lib/apiProxy';
import { type NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get('lang');
  const params = lang ? new URLSearchParams({ lang }) : undefined;
  return proxyGet('/api/series', params);
}
