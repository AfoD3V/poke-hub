import { proxyPost } from '@/lib/apiProxy';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { id: string; pageId: string; slotIndex: string } }) {
  return proxyPost(`/api/binders/${params.id}/pages/${params.pageId}/slots/${params.slotIndex}/copy`, await req.text());
}
