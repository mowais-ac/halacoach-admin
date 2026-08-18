import {VerificationScreen} from '@/components/verification/VerificationScreen';
import {getCurrentUser} from '@/lib/current-user';
import {redirect} from 'next/navigation';

export default async function VerificationPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return <VerificationScreen actor={user} />;
}
