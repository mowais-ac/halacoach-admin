import {OnlineClientDetailScreen} from '@/components/online-clients/OnlineClientDetailScreen';
import {getCurrentUser} from '@/lib/current-user';
import {redirect} from 'next/navigation';

type Props = {
  params: Promise<{id: string}>;
};

export default async function OnlineClientDetailPage({params}: Props) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  const {id} = await params;
  return <OnlineClientDetailScreen id={id} />;
}
