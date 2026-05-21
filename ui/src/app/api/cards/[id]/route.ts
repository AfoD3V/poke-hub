import { proxyGet } from '@/lib/apiProxy';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return proxyGet(`/api/cards/${encodeURIComponent(params.id)}`);
}
