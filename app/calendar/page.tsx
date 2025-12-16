import { redirect } from 'next/navigation';

// This page requires runtime rendering to perform redirects
export const dynamic = 'force-dynamic';

export default function Page() {
  redirect('/admin/schedule');
}
