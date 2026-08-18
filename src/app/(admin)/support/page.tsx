import {SupportScreen} from '@/components/support/SupportScreen';
import {getCurrentUser} from '@/lib/current-user';
import {redirect} from 'next/navigation';

export default async function SupportPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return <SupportScreen actor={user} />;
}
