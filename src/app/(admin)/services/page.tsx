import {ServicesScreen} from '@/components/services/ServicesScreen';
import {getCurrentUser} from '@/lib/current-user';
import {redirect} from 'next/navigation';

export default async function ServicesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return <ServicesScreen actor={user} />;
}
