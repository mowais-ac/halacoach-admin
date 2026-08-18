import {RequestsScreen} from '@/components/requests/RequestsScreen';
import {getCurrentUser} from '@/lib/current-user';
import {redirect} from 'next/navigation';

export default async function RequestsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return <RequestsScreen actor={user} />;
}
