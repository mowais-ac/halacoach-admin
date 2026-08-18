import type {
  Client,
  DashboardActivity,
  DashboardCounts,
  DashboardOverview,
  MarketplaceLead,
  Professional,
  SupportTicket,
} from '@/api/types';
import type {MockState} from '@/api/store';

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function withinDays(iso: string, days: number, now = new Date()) {
  const at = new Date(iso);
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  return at.getTime() >= cutoff;
}

function clientName(clients: Client[], id: string) {
  return clients.find(item => item.id === id)?.name ?? 'Client';
}

function proName(professionals: Professional[], id: string) {
  return professionals.find(item => item.id === id)?.name ?? 'Coach';
}

function ticketUserName(ticket: SupportTicket, clients: Client[], professionals: Professional[]) {
  if (ticket.userType === 'client') {
    return clientName(clients, ticket.userId);
  }
  return proName(professionals, ticket.userId);
}

function collectUnlockActivities(leads: MarketplaceLead[], professionals: Professional[]) {
  const items: DashboardActivity[] = [];
  for (const lead of leads) {
    for (const unlock of lead.unlocks) {
      items.push({
        id: `unlock-${unlock.id}`,
        kind: 'lead_unlock',
        title: `${proName(professionals, unlock.professionalId)} unlocked a lead`,
        subtitle: `${lead.goal} · ${lead.location} · ${unlock.credits} credits`,
        at: unlock.unlockedAt,
        href: `/leads/${lead.id}`,
      });
    }
  }
  return items;
}

export function buildDashboardOverview(state: MockState, now = new Date()): DashboardOverview {
  const pendingVerifications = state.professionals.filter(
    item => item.verification === 'pending' && !item.suspended,
  ).length;

  const openLeads = state.leads.filter(item => item.status === 'open').length;

  const unlocksToday = state.leads.reduce((sum, lead) => {
    return (
      sum +
      lead.unlocks.filter(unlock => isSameDay(new Date(unlock.unlockedAt), now)).length
    );
  }, 0);

  const newClientsWeek = state.clients.filter(item => withinDays(item.createdAt, 7, now)).length;
  const newProsWeek = state.professionals.filter(item =>
    withinDays(item.createdAt, 7, now),
  ).length;

  const creditsSoldAed = state.creditPurchases
    .filter(item => item.status === 'completed')
    .reduce((sum, item) => sum + item.totalAed, 0);

  const openSupportTickets = state.supportTickets.filter(item => item.status !== 'closed').length;

  const counts: DashboardCounts = {
    pendingVerifications,
    openLeads,
    unlocksToday,
    clients: state.clients.length,
    professionals: state.professionals.length,
    newClientsWeek,
    newProsWeek,
    creditsSoldAed,
    openSupportTickets,
  };

  const activity: DashboardActivity[] = [
    ...state.clients.map(client => ({
      id: `client-${client.id}`,
      kind: 'client_signup' as const,
      title: `${client.name} joined`,
      subtitle: client.onboarded ? 'Onboarded client' : 'Incomplete onboarding',
      at: client.createdAt,
      href: `/clients/${client.id}`,
    })),
    ...state.professionals.map(pro => ({
      id: `pro-${pro.id}`,
      kind: 'pro_signup' as const,
      title: `${pro.name} signed up`,
      subtitle: pro.specialty,
      at: pro.createdAt,
      href: `/professionals/${pro.id}`,
    })),
    ...state.professionals
      .filter(item => item.verification === 'pending')
      .map(pro => ({
        id: `verify-${pro.id}`,
        kind: 'verification_pending' as const,
        title: `${pro.name} awaiting verification`,
        subtitle: pro.specialty,
        at: pro.verificationSubmittedAt ?? pro.createdAt,
        href: '/verification',
      })),
    ...collectUnlockActivities(state.leads, state.professionals),
    ...state.creditPurchases.map(purchase => ({
      id: `purchase-${purchase.id}`,
      kind: 'credit_purchase' as const,
      title: `${proName(state.professionals, purchase.professionalId)} purchased credits`,
      subtitle: `${purchase.credits} credits · AED ${purchase.totalAed.toFixed(2)}`,
      at: purchase.at,
      href: '/credits',
    })),
    ...state.supportTickets.map(ticket => ({
      id: `support-${ticket.id}`,
      kind: 'support_ticket' as const,
      title: ticket.subject,
      subtitle: `${ticketUserName(ticket, state.clients, state.professionals)} · ${ticket.status}`,
      at: ticket.createdAt,
      href: `/support/${ticket.id}`,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8);

  return {counts, recentActivity: activity};
}

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
