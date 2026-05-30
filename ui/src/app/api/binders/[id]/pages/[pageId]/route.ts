import { proxyDelete } from '@/lib/apiProxy';
import { NextRequest } from 'next/server';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; pageId: string } }) {
  return proxyDelete(`/api/binders/${params.id}/pages/${params.pageId}`, '');
}
