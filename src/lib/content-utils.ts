import type {ContentLang, LegalDocId, LegalDocument, LegalDocumentSummary} from '@/api/types';

const legalDocLabels: Record<LegalDocId, string> = {
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
  professional: 'Professional Agreement',
};

export function docKey(id: LegalDocId, lang: ContentLang) {
  return `${id}:${lang}`;
}

export function toLegalSummaries(documents: LegalDocument[]): LegalDocumentSummary[] {
  const ids: LegalDocId[] = ['terms', 'privacy', 'professional'];
  return ids.map(id => {
    const en = documents.find(item => item.id === id && item.lang === 'en');
    const ar = documents.find(item => item.id === id && item.lang === 'ar');
    const latest = [en?.updatedAt, ar?.updatedAt]
      .filter(Boolean)
      .sort()
      .reverse()[0];
    return {
      id,
      label: legalDocLabels[id],
      enTitle: en?.title ?? '—',
      arTitle: ar?.title ?? '—',
      sectionCount: en?.sections.length ?? ar?.sections.length ?? 0,
      updatedAt: latest ?? new Date().toISOString(),
    };
  });
}

export function findLegalDocument(
  documents: LegalDocument[],
  id: LegalDocId,
  lang: ContentLang,
) {
  return documents.find(item => item.id === id && item.lang === lang);
}
