import type {AdminRole} from '@/api/types';

export const roleLabels: Record<AdminRole, string> = {
  super: 'Super admin',
  reviewer: 'Reviewer',
  support: 'Support',
};
