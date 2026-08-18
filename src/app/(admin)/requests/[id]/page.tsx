import {RequestDetailScreen} from '@/components/requests/RequestDetailScreen';
import {getCurrentUser} from '@/lib/current-user';
import {redirect} from 'next/navigation';

type Props = {
  params: Promise<{id: string}>;
};

export default async function RequestDetailPage({params}: Props) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  const {id} = await params;
  return <RequestDetailScreen actor={user} id={id} />;
}
