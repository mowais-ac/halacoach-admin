import {MessagesScreen} from '@/components/messages/MessagesScreen';
import {getCurrentUser} from '@/lib/current-user';
import {redirect} from 'next/navigation';

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return <MessagesScreen />;
}
