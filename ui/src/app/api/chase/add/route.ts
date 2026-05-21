import { proxyPost } from '@/lib/apiProxy';

export async function POST(req: Request) {
  const body = await req.text();
  return proxyPost('/api/chase/add', body);
}
