import { proxyPut, proxyDelete } from '@/lib/apiProxy';
import { NextRequest } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: { id: string; pageId: string; slotIndex: string } }) {
  return proxyPut(`/api/binders/${params.id}/pages/${params.pageId}/slots/${params.slotIndex}`, await req.text());
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; pageId: string; slotIndex: string } }) {
  return proxyDelete(`/api/binders/${params.id}/pages/${params.pageId}/slots/${params.slotIndex}`, '');
}
