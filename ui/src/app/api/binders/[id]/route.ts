import { proxyGet, proxyPatch, proxyDelete } from '@/lib/apiProxy';
import { NextRequest } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return proxyGet(`/api/binders/${params.id}`);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return proxyPatch(`/api/binders/${params.id}`, await req.text());
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return proxyDelete(`/api/binders/${params.id}`, '');
}
