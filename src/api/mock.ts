import {ApiError} from './errors';
import {lookupGroups} from './lookups-seed';
import type {AppSettings, LookupGroupId, LookupOption} from './lookups';
import {getMockState, publicAdmin, setMockState} from './store';
import {buildCreditsOverview} from '@/lib/credit-utils';
import {findLegalDocument, toLegalSummaries} from '@/lib/content-utils';
import {buildDashboardOverview} from '@/lib/dashboard-utils';
import {toConversationDetail, toConversationSummary} from '@/lib/message-utils';
import {toSupportDetail, toSupportSummary} from '@/lib/support-utils';
import {toClientSummary} from '@/lib/client-utils';
import {toLeadDetail, toLeadSummary} from '@/lib/lead-utils';
import {toProfessionalSummary, toVerificationQueueItem} from '@/lib/professional-utils';
import {toQuoteRequestDetail, toQuoteRequestSummary} from '@/lib/request-utils';
import type {
  AdminRecord,
  CatalogService,
  Client,
  CreateServiceInput,
  CreditPack,
  HealthResponse,
  InviteAdminInput,
  LoginInput,
  MarketplaceLead,
  Professional,
  PromoCode,
  QuoteRequest,
  RejectVerificationInput,
  SessionResponse,
  UpdateAdminInput,
  UpdateClientInput,
  UpdateCreditPackInput,
  UpdateLeadInput,
  UpdateProfessionalInput,
  UpdatePromoInput,
  UpdateQuoteRequestInput,
  UpdateServiceInput,
  AdjustCreditsInput,
  CreatePromoInput,
  ContentLang,
  LegalDocId,
  LegalDocument,
  UpdateLegalDocumentInput,
  UpdateSupportTicketInput,
} from './types';

const delay = (ms = 160) => new Promise(resolve => setTimeout(resolve, ms));

function parseBody<T>(init?: RequestInit): T {
  if (!init?.body) {
    return {} as T;
  }
  return JSON.parse(String(init.body)) as T;
}

function activeSupers(admins: AdminRecord[]) {
  return admins.filter(admin => admin.role === 'super' && admin.active);
}

/**
 * In-memory handlers that mirror future `/api/v1/admin/*` routes.
 */
export async function mockRequest<T>(path: string, init?: RequestInit): Promise<T> {
  await delay();
  const method = (init?.method ?? 'GET').toUpperCase();
  const state = getMockState();

  if (path === '/admin/dashboard' && method === 'GET') {
    return buildDashboardOverview(state) as T;
  }

  if (path === '/health' && method === 'GET') {
    return {
      ok: true,
      source: 'mock',
      app: 'halacoach-admin',
    } satisfies HealthResponse as T;
  }

  if (path === '/admin/auth/login' && method === 'POST') {
    const {email, password} = parseBody<LoginInput>(init);
    const match = state.admins.find(
      admin => admin.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!match || match.password !== password) {
      throw new ApiError(401, 'Wrong email or password.');
    }
    if (!match.active) {
      throw new ApiError(403, 'This admin account is disabled.');
    }
    match.lastLogin = new Date().toISOString();
    setMockState({admins: [...state.admins]});
    return {user: publicAdmin(match)} satisfies SessionResponse as T;
  }

  if (path === '/admin/admins' && method === 'GET') {
    return state.admins.map(publicAdmin) as T;
  }

  if (path === '/admin/admins' && method === 'POST') {
    const input = parseBody<InviteAdminInput>(init);
    if (!input.name?.trim() || !input.email?.trim() || !input.password) {
      throw new ApiError(400, 'Name, email, and password are required.');
    }
    if (input.password.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters.');
    }
    const email = input.email.trim().toLowerCase();
    if (state.admins.some(admin => admin.email.toLowerCase() === email)) {
      throw new ApiError(409, 'An admin with that email already exists.');
    }
    const record: AdminRecord = {
      id: `admin-${Date.now()}`,
      name: input.name.trim(),
      email,
      password: input.password,
      role: input.role,
      active: true,
      lastLogin: null,
      createdAt: new Date().toISOString(),
    };
    setMockState({admins: [record, ...state.admins]});
    return publicAdmin(record) as T;
  }

  const adminMatch = path.match(/^\/admin\/admins\/([^/]+)$/);
  if (adminMatch && method === 'PATCH') {
    const id = adminMatch[1];
    const input = parseBody<UpdateAdminInput & {actorId?: string}>(init);
    const admins = [...state.admins];
    const index = admins.findIndex(admin => admin.id === id);
    if (index < 0) {
      throw new ApiError(404, 'Admin not found.');
    }
    const current = admins[index]!;
    if (input.actorId === id && input.active === false) {
      throw new ApiError(400, 'You cannot disable your own account.');
    }
    const next: AdminRecord = {
      ...current,
      name: input.name?.trim() || current.name,
      role: input.role ?? current.role,
      active: input.active ?? current.active,
    };
    const nextList = admins.map((admin, i) => (i === index ? next : admin));
    if (activeSupers(nextList).length === 0) {
      throw new ApiError(400, 'Keep at least one active super admin.');
    }
    setMockState({admins: nextList});
    return publicAdmin(next) as T;
  }

  if (path === '/admin/credit-packs' && method === 'GET') {
    return state.packs as T;
  }

  if (path === '/admin/credits' && method === 'GET') {
    return buildCreditsOverview({
      settings: state.settings,
      packs: state.packs,
      promos: state.promos,
      professionals: state.professionals,
      purchases: state.creditPurchases,
    }) as T;
  }

  if (path === '/admin/promo-codes' && method === 'POST') {
    const input = parseBody<CreatePromoInput>(init);
    const code = input.code?.trim().toUpperCase();
    if (!code || code.length < 4) {
      throw new ApiError(400, 'Promo code must be at least 4 characters.');
    }
    if (state.promos.some(item => item.code === code)) {
      throw new ApiError(409, 'That promo code already exists.');
    }
    if (input.discountRate <= 0 || input.discountRate > 0.5) {
      throw new ApiError(400, 'Discount must be between 1% and 50%.');
    }
    const promo: PromoCode = {
      id: `promo-${code.toLowerCase()}-${Date.now()}`,
      code,
      discountRate: input.discountRate,
      active: true,
      createdAt: new Date().toISOString(),
    };
    setMockState({promos: [...state.promos, promo]});
    return promo as T;
  }

  const promoMatch = path.match(/^\/admin\/promo-codes\/([^/]+)$/);
  if (promoMatch && method === 'PATCH') {
    const id = promoMatch[1];
    const input = parseBody<UpdatePromoInput>(init);
    const current = state.promos.find(item => item.id === id);
    if (!current) {
      throw new ApiError(404, 'Promo code not found.');
    }
    const code = input.code?.trim().toUpperCase() || current.code;
    if (state.promos.some(item => item.id !== id && item.code === code)) {
      throw new ApiError(409, 'That promo code already exists.');
    }
    if (input.discountRate !== undefined && (input.discountRate <= 0 || input.discountRate > 0.5)) {
      throw new ApiError(400, 'Discount must be between 1% and 50%.');
    }
    const next: PromoCode = {
      ...current,
      code,
      discountRate: input.discountRate ?? current.discountRate,
      active: input.active ?? current.active,
    };
    setMockState({promos: state.promos.map(item => (item.id === id ? next : item))});
    return next as T;
  }

  if (path === '/admin/credit-adjustments' && method === 'POST') {
    const input = parseBody<AdjustCreditsInput>(init);
    if (!input.professionalId) {
      throw new ApiError(400, 'Professional is required.');
    }
    if (!Number.isFinite(input.credits) || input.credits === 0) {
      throw new ApiError(400, 'Credits must be a non-zero number.');
    }
    const professionals = [...state.professionals];
    const index = professionals.findIndex(item => item.id === input.professionalId);
    if (index < 0) {
      throw new ApiError(404, 'Professional not found.');
    }
    const current = professionals[index]!;
    const nextCredits = current.credits + input.credits;
    if (nextCredits < 0) {
      throw new ApiError(400, 'Adjustment would leave the wallet negative.');
    }
    const txn = {
      id: `t-adj-${Date.now()}`,
      type: 'adjustment' as const,
      credits: Math.abs(input.credits),
      label: input.label?.trim() || (input.credits > 0 ? 'Support credit' : 'Support deduction'),
      at: new Date().toISOString(),
    };
    professionals[index] = {
      ...current,
      credits: nextCredits,
      txns: [txn, ...current.txns],
    };
    setMockState({professionals});
    return professionals[index] as T;
  }

  const packMatch = path.match(/^\/admin\/credit-packs\/([^/]+)$/);
  if (packMatch && method === 'PATCH') {
    const id = packMatch[1];
    const input = parseBody<UpdateCreditPackInput>(init);
    const packs = state.packs.map(pack => {
      if (pack.id !== id) {
        return pack;
      }
      const price = input.price ?? pack.price;
      if (price <= 0) {
        throw new ApiError(400, 'Price must be greater than zero.');
      }
      return {
        ...pack,
        price,
        active: input.active ?? pack.active,
      } satisfies CreditPack;
    });
    if (!packs.some(pack => pack.id === id)) {
      throw new ApiError(404, 'Pack not found.');
    }
    setMockState({packs});
    return packs.find(pack => pack.id === id) as T;
  }

  if (path === '/admin/settings' && method === 'GET') {
    return {
      settings: state.settings,
      lookups: [...state.lookups].sort((a, b) => a.sortOrder - b.sortOrder),
      groups: lookupGroups,
    } as T;
  }

  if (path === '/admin/settings' && method === 'PATCH') {
    const input = parseBody<Partial<AppSettings>>(init);
    const next = validateSettings({...state.settings, ...input});
    setMockState({settings: next});
    return next as T;
  }

  if (path === '/admin/lookups' && method === 'POST') {
    const input = parseBody<{groupId: LookupGroupId; label: string; value?: string}>(init);
    const group = lookupGroups.find(item => item.id === input.groupId);
    if (!group) {
      throw new ApiError(404, 'Unknown lookup group.');
    }
    if (group.locked) {
      throw new ApiError(400, 'This lookup is a system enum. You cannot add values.');
    }
    const label = input.label?.trim();
    if (!label) {
      throw new ApiError(400, 'Label is required.');
    }
    const value = (input.value?.trim() || slugify(label)).toLowerCase();
    if (state.lookups.some(item => item.groupId === input.groupId && item.value === value)) {
      throw new ApiError(409, 'That value already exists in this list.');
    }
    const sortOrder =
      Math.max(0, ...state.lookups.filter(item => item.groupId === input.groupId).map(i => i.sortOrder)) +
      1;
    const option: LookupOption = {
      id: `${input.groupId}-${value}-${Date.now()}`,
      groupId: input.groupId,
      value,
      label,
      sortOrder,
      active: true,
      system: false,
    };
    setMockState({lookups: [...state.lookups, option]});
    return option as T;
  }

  const lookupMatch = path.match(/^\/admin\/lookups\/([^/]+)$/);
  if (lookupMatch && method === 'PATCH') {
    const id = lookupMatch[1];
    const input = parseBody<{label?: string; active?: boolean}>(init);
    const current = state.lookups.find(item => item.id === id);
    if (!current) {
      throw new ApiError(404, 'Lookup option not found.');
    }
    const next: LookupOption = {
      ...current,
      label: input.label?.trim() || current.label,
      active: input.active ?? current.active,
    };
    setMockState({lookups: state.lookups.map(item => (item.id === id ? next : item))});
    return next as T;
  }

  if (path === '/admin/services' && method === 'GET') {
    return [...state.services].sort((a, b) => a.sortOrder - b.sortOrder) as T;
  }

  if (path === '/admin/services' && method === 'POST') {
    const input = parseBody<CreateServiceInput>(init);
    const nameEn = input.nameEn?.trim();
    const nameAr = input.nameAr?.trim();
    if (!nameEn || !nameAr) {
      throw new ApiError(400, 'English and Arabic names are required.');
    }
    const slug = (input.slug?.trim() || slugify(nameEn)).toLowerCase();
    if (!slug) {
      throw new ApiError(400, 'Could not create a slug from that name.');
    }
    if (state.services.some(item => item.slug === slug)) {
      throw new ApiError(409, 'A service with that slug already exists.');
    }
    const sortOrder = Math.max(0, ...state.services.map(item => item.sortOrder)) + 1;
    const service: CatalogService = {
      id: `svc-${slug}-${Date.now()}`,
      slug,
      nameEn,
      nameAr,
      sortOrder,
      active: true,
    };
    setMockState({services: [...state.services, service]});
    return service as T;
  }

  if (path === '/admin/services/reorder' && method === 'POST') {
    const {ids} = parseBody<{ids: string[]}>(init);
    if (!Array.isArray(ids) || ids.length !== state.services.length) {
      throw new ApiError(400, 'Reorder list must include every service.');
    }
    const byId = new Map(state.services.map(item => [item.id, item]));
    const services = ids.map((id, index) => {
      const current = byId.get(id);
      if (!current) {
        throw new ApiError(400, 'Unknown service in reorder list.');
      }
      return {...current, sortOrder: index + 1};
    });
    setMockState({services});
    return services as T;
  }

  const serviceMatch = path.match(/^\/admin\/services\/([^/]+)$/);
  if (serviceMatch && method === 'PATCH') {
    const id = serviceMatch[1];
    const input = parseBody<UpdateServiceInput>(init);
    const current = state.services.find(item => item.id === id);
    if (!current) {
      throw new ApiError(404, 'Service not found.');
    }
    const nameEn = input.nameEn?.trim() || current.nameEn;
    const nameAr = input.nameAr?.trim() || current.nameAr;
    const slug = (input.slug?.trim() || current.slug).toLowerCase();
    if (state.services.some(item => item.id !== id && item.slug === slug)) {
      throw new ApiError(409, 'A service with that slug already exists.');
    }
    const next: CatalogService = {
      ...current,
      nameEn,
      nameAr,
      slug,
      active: input.active ?? current.active,
    };
    setMockState({services: state.services.map(item => (item.id === id ? next : item))});
    return next as T;
  }

  if (path === '/admin/professionals' && method === 'GET') {
    return state.professionals.map(toProfessionalSummary) as T;
  }

  const professionalMatch = path.match(/^\/admin\/professionals\/([^/]+)$/);
  if (professionalMatch && method === 'GET') {
    const id = professionalMatch[1];
    const pro = state.professionals.find(item => item.id === id);
    if (!pro) {
      throw new ApiError(404, 'Professional not found.');
    }
    return pro as T;
  }

  if (professionalMatch && method === 'PATCH') {
    const id = professionalMatch[1];
    const input = parseBody<UpdateProfessionalInput>(init);
    const current = state.professionals.find(item => item.id === id);
    if (!current) {
      throw new ApiError(404, 'Professional not found.');
    }
    const email = input.email?.trim().toLowerCase();
    if (
      email &&
      state.professionals.some(item => item.id !== id && item.email.toLowerCase() === email)
    ) {
      throw new ApiError(409, 'A professional with that email already exists.');
    }
    const serviceSlugs = input.serviceSlugs ?? current.serviceSlugs;
    if (input.serviceSlugs) {
      for (const slug of input.serviceSlugs) {
        if (!state.services.some(item => item.slug === slug && item.active)) {
          throw new ApiError(400, `Unknown or inactive service: ${slug}`);
        }
      }
    }
    const next: Professional = {
      ...current,
      name: input.name?.trim() || current.name,
      email: email || current.email,
      phone: input.phone?.trim() || current.phone,
      specialty: input.specialty?.trim() || current.specialty,
      location: input.location?.trim() || current.location,
      about: input.about?.trim() || current.about,
      years: input.years ?? current.years,
      style: input.style?.trim() || current.style,
      availability: input.availability?.trim() || current.availability,
      priceFrom: input.priceFrom?.trim() || current.priceFrom,
      serviceSlugs,
      locations: input.locations ?? current.locations,
      radiusKm: input.radiusKm ?? current.radiusKm,
      activated: input.activated ?? current.activated,
      suspended: input.suspended ?? current.suspended,
    };
    setMockState({
      professionals: state.professionals.map(item => (item.id === id ? next : item)),
    });
    return next as T;
  }

  if (path === '/admin/clients' && method === 'GET') {
    return state.clients
      .map(toClientSummary)
      .sort(
        (a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime(),
      ) as T;
  }

  const clientMatch = path.match(/^\/admin\/clients\/([^/]+)$/);
  if (clientMatch && method === 'GET') {
    const id = clientMatch[1];
    const client = state.clients.find(item => item.id === id);
    if (!client) {
      throw new ApiError(404, 'Client not found.');
    }
    return client as T;
  }

  if (clientMatch && method === 'PATCH') {
    const id = clientMatch[1];
    const input = parseBody<UpdateClientInput>(init);
    const current = state.clients.find(item => item.id === id);
    if (!current) {
      throw new ApiError(404, 'Client not found.');
    }
    const email = input.email?.trim().toLowerCase();
    if (email && state.clients.some(item => item.id !== id && item.email.toLowerCase() === email)) {
      throw new ApiError(409, 'A client with that email already exists.');
    }
    const next: Client = {
      ...current,
      name: input.name?.trim() || current.name,
      email: email || current.email,
      phone: input.phone?.trim() || current.phone,
      suspended: input.suspended ?? current.suspended,
      answers: {
        ...current.answers,
        email: email || current.answers.email,
        phone: input.phone?.trim() || current.answers.phone,
      },
    };
    setMockState({clients: state.clients.map(item => (item.id === id ? next : item))});
    return next as T;
  }

  if (path === '/admin/leads' && method === 'GET') {
    const clientById = new Map(state.clients.map(item => [item.id, item]));
    return state.leads
      .map(lead => toLeadSummary(lead, clientById.get(lead.clientId)))
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()) as T;
  }

  const leadMatch = path.match(/^\/admin\/leads\/([^/]+)$/);
  if (leadMatch && method === 'GET') {
    const id = leadMatch[1];
    const lead = state.leads.find(item => item.id === id);
    if (!lead) {
      throw new ApiError(404, 'Lead not found.');
    }
    const client = state.clients.find(item => item.id === lead.clientId);
    return toLeadDetail(lead, client, state.professionals) as T;
  }

  if (leadMatch && method === 'PATCH') {
    const id = leadMatch[1];
    const input = parseBody<UpdateLeadInput>(init);
    const current = state.leads.find(item => item.id === id);
    if (!current) {
      throw new ApiError(404, 'Lead not found.');
    }
    if (input.creditCost !== undefined && (input.creditCost < 1 || input.creditCost > 20)) {
      throw new ApiError(400, 'Credit cost must be between 1 and 20.');
    }
    const status = input.status ?? current.status;
    const next: MarketplaceLead = {
      ...current,
      creditCost: input.creditCost ?? current.creditCost,
      status,
      closedAt:
        status === 'closed'
          ? current.closedAt ?? new Date().toISOString()
          : status === 'open'
            ? null
            : current.closedAt,
    };
    setMockState({leads: state.leads.map(item => (item.id === id ? next : item))});
    const client = state.clients.find(item => item.id === next.clientId);
    return toLeadDetail(next, client, state.professionals) as T;
  }

  if (path === '/admin/requests' && method === 'GET') {
    const clientById = new Map(state.clients.map(item => [item.id, item]));
    const proById = new Map(state.professionals.map(item => [item.id, item]));
    return state.quoteRequests
      .map(item =>
        toQuoteRequestSummary(item, clientById.get(item.clientId), proById.get(item.professionalId)),
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as T;
  }

  const requestMatch = path.match(/^\/admin\/requests\/([^/]+)$/);
  if (requestMatch && method === 'GET') {
    const id = requestMatch[1];
    const quoteRequest = state.quoteRequests.find(item => item.id === id);
    if (!quoteRequest) {
      throw new ApiError(404, 'Quote request not found.');
    }
    const client = state.clients.find(item => item.id === quoteRequest.clientId);
    const professional = state.professionals.find(item => item.id === quoteRequest.professionalId);
    return toQuoteRequestDetail(quoteRequest, client, professional) as T;
  }

  if (requestMatch && method === 'PATCH') {
    const id = requestMatch[1];
    const input = parseBody<UpdateQuoteRequestInput>(init);
    const current = state.quoteRequests.find(item => item.id === id);
    if (!current) {
      throw new ApiError(404, 'Quote request not found.');
    }
    const status = input.status ?? current.status;
    const quoteMessage = input.quoteMessage?.trim() ?? current.quoteMessage;
    const quoteAmount = input.quoteAmount?.trim() ?? current.quoteAmount;
    if (status === 'quoted' && !quoteMessage && !current.quoteMessage) {
      throw new ApiError(400, 'Add a quote message before marking as quoted.');
    }
    const now = new Date().toISOString();
    const next: QuoteRequest = {
      ...current,
      status,
      quoteMessage: status === 'pending' ? null : quoteMessage,
      quoteAmount: status === 'pending' ? null : quoteAmount,
      quotedAt:
        status === 'quoted'
          ? current.quotedAt ?? now
          : status === 'pending'
            ? null
            : current.quotedAt,
      closedAt:
        status === 'closed'
          ? current.closedAt ?? now
          : status === 'pending' || status === 'quoted'
            ? null
            : current.closedAt,
    };
    setMockState({
      quoteRequests: state.quoteRequests.map(item => (item.id === id ? next : item)),
    });
    const client = state.clients.find(item => item.id === next.clientId);
    const professional = state.professionals.find(item => item.id === next.professionalId);
    return toQuoteRequestDetail(next, client, professional) as T;
  }

  if (path === '/admin/verification' && method === 'GET') {
    return state.professionals
      .filter(item => item.verification === 'pending')
      .sort(
        (a, b) =>
          new Date(b.verificationSubmittedAt ?? b.createdAt).getTime() -
          new Date(a.verificationSubmittedAt ?? a.createdAt).getTime(),
      )
      .map(toVerificationQueueItem) as T;
  }

  const approveMatch = path.match(/^\/admin\/verification\/([^/]+)\/approve$/);
  if (approveMatch && method === 'POST') {
    const id = approveMatch[1];
    const current = state.professionals.find(item => item.id === id);
    if (!current) {
      throw new ApiError(404, 'Professional not found.');
    }
    if (current.verification !== 'pending') {
      throw new ApiError(400, 'Only pending submissions can be approved.');
    }
    if (current.suspended) {
      throw new ApiError(400, 'Unsuspend the account before approving verification.');
    }
    const next: Professional = {
      ...current,
      verification: 'verified',
      verificationRejectedReason: null,
      activated: true,
    };
    setMockState({
      professionals: state.professionals.map(item => (item.id === id ? next : item)),
    });
    return next as T;
  }

  const rejectMatch = path.match(/^\/admin\/verification\/([^/]+)\/reject$/);
  if (rejectMatch && method === 'POST') {
    const id = rejectMatch[1];
    const input = parseBody<RejectVerificationInput>(init);
    const current = state.professionals.find(item => item.id === id);
    if (!current) {
      throw new ApiError(404, 'Professional not found.');
    }
    if (current.verification !== 'pending') {
      throw new ApiError(400, 'Only pending submissions can be rejected.');
    }
    const reason = input.reason?.trim() || 'Documents could not be verified.';
    const next: Professional = {
      ...current,
      verification: 'rejected',
      verificationRejectedReason: reason,
      activated: false,
    };
    setMockState({
      professionals: state.professionals.map(item => (item.id === id ? next : item)),
    });
    return next as T;
  }

  if (path === '/admin/messages' && method === 'GET') {
    return state.conversations
      .map(item => toConversationSummary(item, state.clients, state.professionals))
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()) as T;
  }

  const messageMatch = path.match(/^\/admin\/messages\/([^/]+)$/);
  if (messageMatch && method === 'GET') {
    const id = messageMatch[1];
    const conversation = state.conversations.find(item => item.id === id);
    if (!conversation) {
      throw new ApiError(404, 'Conversation not found.');
    }
    return toConversationDetail(conversation, state.clients, state.professionals) as T;
  }

  if (path === '/admin/support' && method === 'GET') {
    return state.supportTickets
      .map(ticket => toSupportSummary(ticket, state.clients, state.professionals))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as T;
  }

  const supportMatch = path.match(/^\/admin\/support\/([^/]+)$/);
  if (supportMatch && method === 'GET') {
    const id = supportMatch[1];
    const ticket = state.supportTickets.find(item => item.id === id);
    if (!ticket) {
      throw new ApiError(404, 'Support ticket not found.');
    }
    return toSupportDetail(ticket, state.clients, state.professionals) as T;
  }

  if (supportMatch && method === 'PATCH') {
    const id = supportMatch[1];
    const input = parseBody<UpdateSupportTicketInput>(init);
    const tickets = [...state.supportTickets];
    const index = tickets.findIndex(item => item.id === id);
    if (index < 0) {
      throw new ApiError(404, 'Support ticket not found.');
    }
    const current = tickets[index]!;
    const replyNote = input.replyNote !== undefined ? input.replyNote.trim() : current.replyNote;
    const status = input.status ?? current.status;
    if (status === 'replied' && !replyNote) {
      throw new ApiError(400, 'Add a reply note before marking as replied.');
    }
    const now = new Date().toISOString();
    const next = {
      ...current,
      status,
      replyNote: replyNote || null,
      repliedAt:
        status === 'replied' || status === 'closed'
          ? current.repliedAt ?? now
          : current.repliedAt,
      repliedBy:
        status === 'replied' || status === 'closed'
          ? input.actorName?.trim() || current.repliedBy || 'Support'
          : current.repliedBy,
      closedAt: status === 'closed' ? current.closedAt ?? now : null,
    };
    if (input.replyNote?.trim() && status === 'new') {
      next.status = 'replied';
      next.repliedAt = now;
      next.repliedBy = input.actorName?.trim() || 'Support';
    }
    tickets[index] = next;
    setMockState({supportTickets: tickets});
    return toSupportDetail(next, state.clients, state.professionals) as T;
  }

  if (path === '/admin/content' && method === 'GET') {
    return toLegalSummaries(state.legalDocuments) as T;
  }

  const contentMatch = path.match(/^\/admin\/content\/(terms|privacy|professional)\/(en|ar)$/);
  if (contentMatch && method === 'GET') {
    const [, docId, lang] = contentMatch as [string, LegalDocId, ContentLang];
    const doc = findLegalDocument(state.legalDocuments, docId, lang);
    if (!doc) {
      throw new ApiError(404, 'Legal document not found.');
    }
    return doc as T;
  }

  if (contentMatch && method === 'PATCH') {
    const [, docId, lang] = contentMatch as [string, LegalDocId, ContentLang];
    const input = parseBody<UpdateLegalDocumentInput>(init);
    const documents = [...state.legalDocuments];
    const index = documents.findIndex(item => item.id === docId && item.lang === lang);
    if (index < 0) {
      throw new ApiError(404, 'Legal document not found.');
    }
    const current = documents[index]!;
    const title = input.title?.trim() || current.title;
    const intro = input.intro?.trim() || current.intro;
    if (!title || !intro) {
      throw new ApiError(400, 'Title and intro are required.');
    }
    const sections = input.sections ?? current.sections;
    if (!sections.length) {
      throw new ApiError(400, 'At least one section is required.');
    }
    for (const section of sections) {
      if (!section.heading.trim() || !section.body.trim()) {
        throw new ApiError(400, 'Each section needs a heading and body.');
      }
    }
    const next: LegalDocument = {
      ...current,
      title,
      intro,
      sections: sections.map(section => ({
        heading: section.heading.trim(),
        body: section.body.trim(),
      })),
      updatedAt: new Date().toISOString(),
    };
    documents[index] = next;
    setMockState({legalDocuments: documents});
    return next as T;
  }

  throw new ApiError(404, `Mock has no handler for ${method} ${path}`);
}

function slugify(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function validateSettings(settings: AppSettings): AppSettings {
  if (settings.otpLength < 4 || settings.otpLength > 8) {
    throw new ApiError(400, 'OTP length must be between 4 and 8.');
  }
  if (settings.otpResendSeconds < 10 || settings.otpResendSeconds > 120) {
    throw new ApiError(400, 'OTP resend must be between 10 and 120 seconds.');
  }
  if (!/^\+\d{1,4}$/.test(settings.defaultPhonePrefix.trim())) {
    throw new ApiError(400, 'Phone prefix must look like +971.');
  }
  if (settings.vatRate < 0 || settings.vatRate > 0.5) {
    throw new ApiError(400, 'VAT rate must be between 0 and 50%.');
  }
  if (settings.maxGoals < 1 || settings.maxGoals > 5) {
    throw new ApiError(400, 'Max goals must be between 1 and 5.');
  }
  return {
    otpLength: Math.round(settings.otpLength),
    otpResendSeconds: Math.round(settings.otpResendSeconds),
    defaultPhonePrefix: settings.defaultPhonePrefix.trim(),
    vatRate: settings.vatRate,
    maxGoals: Math.round(settings.maxGoals),
  };
}
