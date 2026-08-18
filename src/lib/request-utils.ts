import type {Client, Professional, QuoteRequest, QuoteRequestDetail, QuoteRequestSummary} from '@/api/types';

export function toQuoteRequestSummary(
  request: QuoteRequest,
  client?: Client,
  professional?: Professional,
): QuoteRequestSummary {
  return {
    id: request.id,
    clientId: request.clientId,
    clientName: client?.name ?? 'Unknown client',
    professionalId: request.professionalId,
    professionalName: professional?.name ?? 'Unknown coach',
    professionalSpecialty: professional?.specialty ?? '—',
    status: request.status,
    createdAt: request.createdAt,
  };
}

export function toQuoteRequestDetail(
  request: QuoteRequest,
  client: Client | undefined,
  professional: Professional | undefined,
): QuoteRequestDetail {
  return {
    ...request,
    clientName: client?.name ?? 'Unknown client',
    clientEmail: client?.email ?? '—',
    clientPhone: client?.phone ?? '—',
    professionalName: professional?.name ?? 'Unknown coach',
    professionalSpecialty: professional?.specialty ?? '—',
  };
}

export const quoteStatusLabels = {
  pending: 'Awaiting reply',
  quoted: 'Quote received',
  closed: 'Closed',
} as const;

export function quoteStatusTone(status: QuoteRequestSummary['status']) {
  if (status === 'quoted') {
    return 'primary' as const;
  }
  if (status === 'closed') {
    return 'muted' as const;
  }
  return 'warning' as const;
}
