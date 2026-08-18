import {AdminsScreen} from '@/components/admins/AdminsScreen';
import {getCurrentUser} from '@/lib/current-user';
import {redirect} from 'next/navigation';

export default async function AdminsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return <AdminsScreen actor={user} />;
}
