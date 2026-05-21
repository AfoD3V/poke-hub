import { proxyDelete } from '@/lib/apiProxy';

export async function DELETE(req: Request) {
  const body = await req.text();
  return proxyDelete('/api/collection/remove', body);
}
