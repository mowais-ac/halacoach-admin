import type {AdminRecord, AdminRole, CatalogService, Client, Conversation, CreditPurchase, LegalDocument, MarketplaceLead, Professional, PromoCode, QuoteRequest, SupportTicket} from './types';
import {seedConversations} from './messages-seed';
import {seedSupportTickets} from './support-seed';
import {seedLegalDocuments} from './content-seed';
import type {AppSettings, LookupOption} from './lookups';
import {seedCreditPurchases, seedPromoCodes} from './credits-seed';
import {seedClients} from './clients-seed';
import {seedLeads} from './leads-seed';
import {seedLookups, seedSettings} from './lookups-seed';
import {seedProfessionals} from './professionals-seed';
import {seedQuoteRequests} from './requests-seed';
import {seedServices} from './services-seed';
import {normalizeNotificationPrefs} from '@/lib/notification-utils';

const STORAGE_KEY = 'hc_admin_mock_v1';

const now = '2026-08-18T00:00:00.000Z';

export const seedAdmins: AdminRecord[] = [
  {
    id: 'admin-super',
    name: 'HalaCoach Admin',
    email: 'admin@halacoach.local',
    password: 'Admin123!',
    role: 'super',
    active: true,
    lastLogin: null,
    createdAt: now,
  },
  {
    id: 'admin-reviewer',
    name: 'Noura Reviewer',
    email: 'reviewer@halacoach.local',
    password: 'Review123!',
    role: 'reviewer',
    active: true,
    lastLogin: null,
    createdAt: now,
  },
  {
    id: 'admin-support',
    name: 'Omar Support',
    email: 'support@halacoach.local',
    password: 'Support123!',
    role: 'support',
    active: true,
    lastLogin: null,
    createdAt: now,
  },
];

export type MockState = {
  admins: AdminRecord[];
  lookups: LookupOption[];
  settings: AppSettings;
  services: CatalogService[];
  professionals: Professional[];
  clients: Client[];
  leads: MarketplaceLead[];
  quoteRequests: QuoteRequest[];
  promos: PromoCode[];
  creditPurchases: CreditPurchase[];
  legalDocuments: LegalDocument[];
  supportTickets: SupportTicket[];
  conversations: Conversation[];
};

const memory: MockState = {
  admins: structuredClone(seedAdmins),
  lookups: structuredClone(seedLookups),
  settings: structuredClone(seedSettings),
  services: structuredClone(seedServices),
  professionals: structuredClone(seedProfessionals),
  clients: structuredClone(seedClients),
  leads: structuredClone(seedLeads),
  quoteRequests: structuredClone(seedQuoteRequests),
  promos: structuredClone(seedPromoCodes),
  creditPurchases: structuredClone(seedCreditPurchases),
  legalDocuments: structuredClone(seedLegalDocuments),
  supportTickets: structuredClone(seedSupportTickets),
  conversations: structuredClone(seedConversations),
};

function readStorage(): Partial<MockState> | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as Partial<MockState>;
  } catch {
    return null;
  }
}

function persist(state: MockState) {
  memory.admins = state.admins;
  memory.lookups = state.lookups;
  memory.settings = state.settings;
  memory.services = state.services;
  memory.professionals = state.professionals;
  memory.clients = state.clients;
  memory.leads = state.leads;
  memory.quoteRequests = state.quoteRequests;
  memory.promos = state.promos;
  memory.creditPurchases = state.creditPurchases;
  memory.legalDocuments = state.legalDocuments;
  memory.supportTickets = state.supportTickets;
  memory.conversations = state.conversations;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}


function mergeServices(stored?: CatalogService[]): CatalogService[] {
  const seed = structuredClone(seedServices);
  if (!stored?.length) {
    return seed;
  }
  const bySlug = new Map(stored.map(item => [item.slug, item]));
  for (const item of seed) {
    if (!bySlug.has(item.slug)) {
      stored.push({...item, sortOrder: stored.length + 1});
    }
  }
  return stored;
}

function mergeProfessionals(stored?: Professional[]): Professional[] {
  const seed = structuredClone(seedProfessionals);
  const seedById = new Map(seed.map(item => [item.id, item]));
  if (!stored?.length) {
    return seed;
  }
  const merged = stored.map(item => {
    const defaults = seedById.get(item.id);
    return {
      ...defaults,
      ...item,
      verificationSubmittedAt:
        item.verificationSubmittedAt ?? defaults?.verificationSubmittedAt ?? null,
      verificationRejectedReason:
        item.verificationRejectedReason ?? defaults?.verificationRejectedReason ?? null,
      notificationPrefs: normalizeNotificationPrefs(
        item.notificationPrefs ?? defaults?.notificationPrefs,
      ),
    };
  });
  for (const item of seed) {
    if (!merged.some(row => row.id === item.id)) {
      merged.push(item);
    }
  }
  return merged;
}

function mergeClients(stored?: Client[]): Client[] {
  const seed = structuredClone(seedClients);
  const seedById = new Map(seed.map(item => [item.id, item]));
  if (!stored?.length) {
    return seed;
  }
  const merged = stored.map(item => {
    const defaults = seedById.get(item.id);
    return defaults
      ? {
          ...defaults,
          ...item,
          answers: {...defaults.answers, ...item.answers},
          notificationPrefs: normalizeNotificationPrefs(
            item.notificationPrefs ?? defaults.notificationPrefs,
          ),
        }
      : {
          ...item,
          notificationPrefs: normalizeNotificationPrefs(item.notificationPrefs),
        };
  });
  for (const item of seed) {
    if (!merged.some(row => row.id === item.id)) {
      merged.push(item);
    }
  }
  return merged;
}

function mergeLeads(stored?: MarketplaceLead[]): MarketplaceLead[] {
  const seed = structuredClone(seedLeads);
  const seedById = new Map(seed.map(item => [item.id, item]));
  if (!stored?.length) {
    return seed;
  }
  const merged = stored.map(item => {
    const defaults = seedById.get(item.id);
    return defaults
      ? {...defaults, ...item, unlocks: item.unlocks?.length ? item.unlocks : defaults.unlocks}
      : item;
  });
  for (const item of seed) {
    if (!merged.some(row => row.id === item.id)) {
      merged.push(item);
    }
  }
  return merged;
}

function mergeConversations(stored?: Conversation[]): Conversation[] {
  const seed = structuredClone(seedConversations);
  if (!stored?.length) {
    return seed;
  }
  const byId = new Map(stored.map(item => [item.id, item]));
  return seed.map(item => byId.get(item.id) ?? item);
}

function mergeSupportTickets(stored?: SupportTicket[]): SupportTicket[] {
  const seed = structuredClone(seedSupportTickets);
  if (!stored?.length) {
    return seed;
  }
  const byId = new Map(stored.map(item => [item.id, item]));
  return seed.map(item => byId.get(item.id) ?? item);
}

function mergeLegalDocuments(stored?: LegalDocument[]): LegalDocument[] {
  const seed = structuredClone(seedLegalDocuments);
  if (!stored?.length) {
    return seed;
  }
  const key = (doc: LegalDocument) => `${doc.id}:${doc.lang}`;
  const byKey = new Map(stored.map(item => [key(item), item]));
  return seed.map(item => {
    const saved = byKey.get(key(item));
    return saved ? {...item, ...saved, sections: saved.sections?.length ? saved.sections : item.sections} : item;
  });
}

function mergeQuoteRequests(stored?: QuoteRequest[]): QuoteRequest[] {
  const seed = structuredClone(seedQuoteRequests);
  const seedById = new Map(seed.map(item => [item.id, item]));
  if (!stored?.length) {
    return seed;
  }
  const merged = stored.map(item => {
    const defaults = seedById.get(item.id);
    return defaults ? {...defaults, ...item} : item;
  });
  for (const item of seed) {
    if (!merged.some(row => row.id === item.id)) {
      merged.push(item);
    }
  }
  return merged;
}

function mergeState(stored: Partial<MockState> | null): MockState {
  return {
    admins: stored?.admins?.length ? stored.admins : structuredClone(seedAdmins),
    lookups: stored?.lookups?.length ? stored.lookups : structuredClone(seedLookups),
    settings: stored?.settings ?? structuredClone(seedSettings),
    services: mergeServices(stored?.services),
    professionals: mergeProfessionals(stored?.professionals),
    clients: mergeClients(stored?.clients),
    leads: mergeLeads(stored?.leads),
    quoteRequests: mergeQuoteRequests(stored?.quoteRequests),
    promos: stored?.promos?.length ? stored.promos : structuredClone(seedPromoCodes),
    creditPurchases: stored?.creditPurchases?.length
      ? stored.creditPurchases
      : structuredClone(seedCreditPurchases),
    legalDocuments: mergeLegalDocuments(stored?.legalDocuments),
    supportTickets: mergeSupportTickets(stored?.supportTickets),
    conversations: mergeConversations(stored?.conversations),
  };
}

export function getMockState(): MockState {
  const next = mergeState(readStorage());
  memory.admins = next.admins;
  memory.lookups = next.lookups;
  memory.settings = next.settings;
  memory.services = next.services;
  memory.professionals = next.professionals;
  memory.clients = next.clients;
  memory.leads = next.leads;
  memory.quoteRequests = next.quoteRequests;
  memory.promos = next.promos;
  memory.creditPurchases = next.creditPurchases;
  memory.legalDocuments = next.legalDocuments;
  memory.supportTickets = next.supportTickets;
  memory.conversations = next.conversations;
  return memory;
}

export function setMockState(patch: Partial<MockState>) {
  const current = getMockState();
  persist({
    admins: patch.admins ?? current.admins,
    lookups: patch.lookups ?? current.lookups,
    settings: patch.settings ?? current.settings,
    services: patch.services ?? current.services,
    professionals: patch.professionals ?? current.professionals,
    clients: patch.clients ?? current.clients,
    leads: patch.leads ?? current.leads,
    quoteRequests: patch.quoteRequests ?? current.quoteRequests,
    promos: patch.promos ?? current.promos,
    creditPurchases: patch.creditPurchases ?? current.creditPurchases,
    legalDocuments: patch.legalDocuments ?? current.legalDocuments,
    supportTickets: patch.supportTickets ?? current.supportTickets,
    conversations: patch.conversations ?? current.conversations,
  });
}

export function publicAdmin(record: AdminRecord) {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    active: record.active,
    lastLogin: record.lastLogin,
    createdAt: record.createdAt,
  };
}

export const roleLabels: Record<AdminRole, string> = {
  super: 'Super admin',
  reviewer: 'Reviewer',
  support: 'Support',
};
