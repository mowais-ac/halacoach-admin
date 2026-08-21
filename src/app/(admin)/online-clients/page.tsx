import {OnlineClientsScreen} from '@/components/online-clients/OnlineClientsScreen';
import {getCurrentUser} from '@/lib/current-user';
import {redirect} from 'next/navigation';

export default async function OnlineClientsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return <OnlineClientsScreen />;
}
