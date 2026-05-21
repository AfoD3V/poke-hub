'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logout(): Promise<never> {
  cookies().delete('pokehub_session');
  redirect('/auth/login');
}
