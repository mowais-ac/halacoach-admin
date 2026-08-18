import {CreditsScreen} from '@/components/credits/CreditsScreen';
import {getCurrentUser} from '@/lib/current-user';
import {redirect} from 'next/navigation';

export default async function CreditsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return <CreditsScreen actor={user} />;
}
