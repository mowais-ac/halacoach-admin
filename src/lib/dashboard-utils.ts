import type {DashboardActivity} from '@/api/types';

export function formatDashboardTime(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const dashboardActivityLabels: Record<DashboardActivity['kind'], string> = {
  client_signup: 'Client',
  pro_signup: 'Professional',
  verification_pending: 'Verification',
  lead_unlock: 'Unlock',
  credit_purchase: 'Credits',
  support_ticket: 'Support',
};
