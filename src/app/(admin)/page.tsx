import {DashboardScreen} from '@/components/dashboard/DashboardScreen';
import {getCurrentUser} from '@/lib/current-user';
import {redirect} from 'next/navigation';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return <DashboardScreen actor={user} />;
}
