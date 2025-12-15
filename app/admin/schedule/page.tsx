import { redirect } from 'next/navigation';

export default function AdminSchedulePage() {
  // Redirect to the main calendar page since scheduling is handled there
  redirect('/calendar');
}
