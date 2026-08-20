import {request} from './client';
import type {
  AdminUser,
  AppSettings,
  CatalogService,
  Client,
  ClientSummary,
  CreateServiceInput,
  CreditsOverview,
  HealthResponse,
  InviteAdminInput,
  LeadDetail,
  LeadSummary,
  LookupGroupId,
  LookupGroupMeta,
  LookupOption,
  Professional,
  ProfessionalSummary,
  QuoteRequestDetail,
  QuoteRequestSummary,
  RejectVerificationInput,
  SessionResponse,
  UpdateAdminInput,
  UpdateClientInput,
  UpdateLeadInput,
  UpdateLegalDocumentInput,
  UpdateProfessionalInput,
  UpdateQuoteRequestInput,
  UpdateServiceInput,
  VerificationQueueItem,
  AdjustCreditsInput,
  ContentLang,
  LegalDocId,
  LegalDocument,
  LegalDocumentSummary,
  SupportTicketDetail,
  SupportTicketSummary,
  UpdateSupportTicketInput,
  ConversationDetail,
  ConversationSummary,
  DashboardOverview,
} from './types';

export type {
  AdminRole,
  AdminUser,
  AdjustCreditsInput,
  AppSettings,
  CatalogService,
  Client,
  ClientAnswers,
  ClientConsents,
  ClientSummary,
  ChatMessage,
  ContentLang,
  ConversationDetail,
  ConversationSummary,
  CreateCreditPackageInput,
  CreatePromoInput,
  CreateServiceInput,
  DashboardActivity,
  DashboardActivityKind,
  DashboardCounts,
  DashboardOverview,
  CreditLedgerEntry,
  CreditPackage,
  CreditPackageBadge,
  CreditsOverview,
  CreditPurchase,
  HealthResponse,
  InviteAdminInput,
  LeadDetail,
  LeadStatus,
  LeadSummary,
  LeadUnlock,
  LegalDocId,
  LegalDocument,
  LegalDocumentSummary,
  LegalSection,
  LookupGroupId,
  LookupGroupMeta,
  LookupOption,
  MessageAuthor,
  NotificationPrefs,
  Professional,
  ProfessionalSummary,
  ProfessionalTxn,
  PromoCode,
  QuoteRequestDetail,
  QuoteRequestStatus,
  QuoteRequestSummary,
  RejectVerificationInput,
  SessionResponse,
  SessionUser,
  SupportTicketDetail,
  SupportTicketStatus,
  SupportTicketSummary,
  SupportUserType,
  UpdateAdminInput,
  UpdateClientInput,
  UpdateCreditPackageInput,
  UpdateLeadInput,
  UpdateLegalDocumentInput,
  UpdateProfessionalInput,
  UpdatePromoInput,
  UpdateQuoteRequestInput,
  UpdateServiceInput,
  UpdateSupportTicketInput,
  VerificationStatus,
  VerificationQueueItem,
} from './types';
export {ApiError, isApiError} from './errors';

export function getHealth() {
  return request<HealthResponse>('/health');
}

export function getDashboardOverview() {
  return request<DashboardOverview>('/admin/dashboard');
}

export function login(email: string, password: string) {
  return request<SessionResponse>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({email, password}),
  });
}

export function listAdmins() {
  return request<AdminUser[]>('/v1/admins');
}

export function inviteAdmin(input: InviteAdminInput) {
  return request<AdminUser>('/v1/admins', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateAdmin(id: number, input: UpdateAdminInput & {actorId: number}) {
  return request<AdminUser>(`/v1/admins/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function getCreditsOverview(): Promise<CreditsOverview> {
  const {listCreditPackages, listPromoCodes} = await import('@/lib/apis');
  const [packs, promos, rest] = await Promise.all([
    listCreditPackages(),
    listPromoCodes(),
    request<Omit<CreditsOverview, 'packs' | 'promos'>>('/admin/credits-meta'),
  ]);
  return {...rest, packs, promos};
}

export {createPromoCode, listPromoCodes, updatePromoCode} from '@/lib/apis';

export function adjustCredits(input: AdjustCreditsInput) {
  return request<Professional>(`/admin/credit-adjustments`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export type SettingsPayload = {
  settings: AppSettings;
  lookups: LookupOption[];
  groups: LookupGroupMeta[];
};

export function getSettings() {
  return request<SettingsPayload>('/admin/settings');
}

export function updateSettings(input: Partial<AppSettings>) {
  return request<AppSettings>('/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function addLookupOption(input: {groupId: LookupGroupId; label: string; value?: string}) {
  return request<LookupOption>('/admin/lookups', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateLookupOption(
  id: string,
  input: {label?: string; active?: boolean},
) {
  return request<LookupOption>(`/admin/lookups/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function listServices() {
  return request<CatalogService[]>('/admin/services');
}

export function createService(input: CreateServiceInput) {
  return request<CatalogService>('/admin/services', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateService(id: string, input: UpdateServiceInput) {
  return request<CatalogService>(`/admin/services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function reorderServices(ids: string[]) {
  return request<CatalogService[]>('/admin/services/reorder', {
    method: 'POST',
    body: JSON.stringify({ids}),
  });
}

export function listProfessionals() {
  return request<ProfessionalSummary[]>('/admin/professionals');
}

export function getProfessional(id: string) {
  return request<Professional>(`/admin/professionals/${id}`);
}

export function updateProfessional(id: string, input: UpdateProfessionalInput) {
  return request<Professional>(`/admin/professionals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function listVerificationQueue() {
  return request<VerificationQueueItem[]>('/admin/verification');
}

export function approveVerification(id: string) {
  return request<Professional>(`/admin/verification/${id}/approve`, {method: 'POST'});
}

export function rejectVerification(id: string, input: RejectVerificationInput = {}) {
  return request<Professional>(`/admin/verification/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listClients() {
  return request<ClientSummary[]>('/admin/clients');
}

export function getClient(id: string) {
  return request<Client>(`/admin/clients/${id}`);
}

export function updateClient(id: string, input: UpdateClientInput) {
  return request<Client>(`/admin/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function listLeads() {
  return request<LeadSummary[]>('/admin/leads');
}

export function getLead(id: string) {
  return request<LeadDetail>(`/admin/leads/${id}`);
}

export function updateLead(id: string, input: UpdateLeadInput) {
  return request<LeadDetail>(`/admin/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function listQuoteRequests() {
  return request<QuoteRequestSummary[]>('/admin/requests');
}

export function getQuoteRequest(id: string) {
  return request<QuoteRequestDetail>(`/admin/requests/${id}`);
}

export function updateQuoteRequest(id: string, input: UpdateQuoteRequestInput) {
  return request<QuoteRequestDetail>(`/admin/requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function listLegalDocuments() {
  return request<LegalDocumentSummary[]>('/admin/content');
}

export function getLegalDocument(id: LegalDocId, lang: ContentLang) {
  return request<LegalDocument>(`/admin/content/${id}/${lang}`);
}

export function updateLegalDocument(
  id: LegalDocId,
  lang: ContentLang,
  input: UpdateLegalDocumentInput,
) {
  return request<LegalDocument>(`/admin/content/${id}/${lang}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function listSupportTickets() {
  return request<SupportTicketSummary[]>('/admin/support');
}

export function getSupportTicket(id: string) {
  return request<SupportTicketDetail>(`/admin/support/${id}`);
}

export function updateSupportTicket(id: string, input: UpdateSupportTicketInput) {
  return request<SupportTicketDetail>(`/admin/support/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function listConversations() {
  return request<ConversationSummary[]>('/admin/messages');
}

export function getConversation(id: string) {
  return request<ConversationDetail>(`/admin/messages/${id}`);
}
