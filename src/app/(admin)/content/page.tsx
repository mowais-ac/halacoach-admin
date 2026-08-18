import {ContentScreen} from '@/components/content/ContentScreen';
import {getCurrentUser} from '@/lib/current-user';
import {redirect} from 'next/navigation';

export default async function ContentPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return <ContentScreen actor={user} />;
}
