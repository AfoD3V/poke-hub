import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function RootPage() {
  const session = cookies().get('pokehub_session');
  if (session) {
    redirect('/home');
  } else {
    redirect('/auth/login');
  }
}
