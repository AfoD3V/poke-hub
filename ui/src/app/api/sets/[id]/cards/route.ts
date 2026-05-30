import { proxyGet } from '@/lib/apiProxy';
import { type NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const lang = req.nextUrl.searchParams.get('lang');
  const searchParams = lang ? new URLSearchParams({ lang }) : undefined;
  return proxyGet(`/api/sets/${encodeURIComponent(params.id)}/cards`, searchParams);
}
