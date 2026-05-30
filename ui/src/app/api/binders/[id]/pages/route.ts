import { proxyPost } from '@/lib/apiProxy';
import { NextRequest } from 'next/server';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  return proxyPost(`/api/binders/${params.id}/pages`, '');
}
