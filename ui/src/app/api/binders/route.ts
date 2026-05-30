import { proxyGet, proxyPost } from '@/lib/apiProxy';
import { NextRequest } from 'next/server';

export async function GET() {
  return proxyGet('/api/binders');
}

export async function POST(req: NextRequest) {
  return proxyPost('/api/binders', await req.text());
}
