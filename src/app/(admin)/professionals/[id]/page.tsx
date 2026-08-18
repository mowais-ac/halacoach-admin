import {ProfessionalDetailScreen} from '@/components/professionals/ProfessionalDetailScreen';
import {getCurrentUser} from '@/lib/current-user';
import {redirect} from 'next/navigation';

type Props = {
  params: Promise<{id: string}>;
};

export default async function ProfessionalDetailPage({params}: Props) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  const {id} = await params;
  return <ProfessionalDetailScreen actor={user} id={id} />;
}
