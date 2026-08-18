'use client';

import {FormEvent, useEffect, useState} from 'react';
import {
  getLegalDocument,
  isApiError,
  listLegalDocuments,
  updateLegalDocument,
  type ContentLang,
  type LegalDocId,
  type LegalDocument,
  type LegalDocumentSummary,
  type LegalSection,
  type SessionUser,
} from '@/api';
import {Badge} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {ErrorState} from '@/components/ui/ErrorState';
import {Input} from '@/components/ui/Input';
import {LoadingState} from '@/components/ui/LoadingState';
import {PageHeader} from '@/components/ui/PageHeader';
import {cn} from '@/lib/cn';
import {can} from '@/lib/permissions';

const docOrder: LegalDocId[] = ['terms', 'privacy', 'professional'];

function formatUpdated(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ContentScreen({actor}: {actor: SessionUser}) {
  const canWrite = can(actor.role, 'content:write');
  const [summaries, setSummaries] = useState<LegalDocumentSummary[]>([]);
  const [selectedId, setSelectedId] = useState<LegalDocId>('terms');
  const [lang, setLang] = useState<ContentLang>('en');
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [draft, setDraft] = useState<LegalDocument | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadSummaries = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listLegalDocuments();
      setSummaries(list);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not load legal content.');
    } finally {
      setLoading(false);
    }
  };

  const loadDoc = async (id: LegalDocId, nextLang: ContentLang) => {
    setLoadingDoc(true);
    setError(null);
    setMessage(null);
    try {
      const next = await getLegalDocument(id, nextLang);
      setDoc(next);
      setDraft(next);
      setEditing(false);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not load document.');
    } finally {
      setLoadingDoc(false);
    }
  };

  useEffect(() => {
    void loadSummaries();
  }, []);

  useEffect(() => {
    void loadDoc(selectedId, lang);
  }, [selectedId, lang]);

  const selectedSummary = summaries.find(item => item.id === selectedId);

  const updateSection = (index: number, patch: Partial<LegalSection>) => {
    if (!draft) {
      return;
    }
    setDraft({
      ...draft,
      sections: draft.sections.map((section, i) => (i === index ? {...section, ...patch} : section)),
    });
  };

  const addSection = () => {
    if (!draft) {
      return;
    }
    setDraft({
      ...draft,
      sections: [...draft.sections, {heading: 'New section', body: ''}],
    });
  };

  const removeSection = (index: number) => {
    if (!draft || draft.sections.length <= 1) {
      return;
    }
    setDraft({
      ...draft,
      sections: draft.sections.filter((_, i) => i !== index),
    });
  };

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft || !canWrite) {
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const next = await updateLegalDocument(draft.id, draft.lang, {
        title: draft.title,
        intro: draft.intro,
        sections: draft.sections,
      });
      setDoc(next);
      setDraft(next);
      setEditing(false);
      setMessage('Document saved.');
      await loadSummaries();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not save document.');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setDraft(doc);
    setEditing(false);
    setMessage(null);
  };

  if (loading) {
    return <LoadingState label="Loading legal content…" />;
  }

  if (error && !doc) {
    return <ErrorState body={error} onRetry={() => void loadSummaries()} />;
  }

  return (
    <div>
      <PageHeader
        module="M10"
        title="Content"
        description="Terms, Privacy, and Professional Agreement — English and Arabic copies shown in the mobile app."
        actions={
          canWrite && doc && !editing ? (
            <Button type="button" onClick={() => setEditing(true)}>
              Edit {lang.toUpperCase()}
            </Button>
          ) : null
        }
      />

      {error ? (
        <div className="mb-4">
          <ErrorState body={error} onRetry={() => void loadDoc(selectedId, lang)} />
        </div>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {docOrder.map(id => {
          const summary = summaries.find(item => item.id === id);
          const active = selectedId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSelectedId(id)}
              className={cn(
                'rounded-2xl border p-4 text-left transition',
                active
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/40',
              )}
            >
              <p className="font-semibold text-foreground">{summary?.label ?? id}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary?.sectionCount ?? 0} sections · updated{' '}
                {summary ? formatUpdated(summary.updatedAt) : '—'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="muted">{summary?.enTitle ?? 'EN'}</Badge>
                <Badge tone="muted">{summary?.arTitle ?? 'AR'}</Badge>
              </div>
            </button>
          );
        })}
      </div>

      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {selectedSummary?.label ?? selectedId}
            </h2>
            <p className="text-sm text-muted-foreground">
              {doc ? `Last saved ${formatUpdated(doc.updatedAt)}` : 'Loading…'}
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
            {(['en', 'ar'] as ContentLang[]).map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setLang(item)}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition',
                  lang === item
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item === 'en' ? 'English' : 'Arabic'}
              </button>
            ))}
          </div>
        </div>

        {loadingDoc ? (
          <LoadingState label="Loading document…" />
        ) : editing && draft && canWrite ? (
          <form className="space-y-5" onSubmit={onSave}>
            <Input
              label="Title"
              value={draft.title}
              onChange={event => setDraft({...draft, title: event.target.value})}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            />
            <label className="block text-sm font-medium text-foreground">
              Intro
              <textarea
                value={draft.intro}
                onChange={event => setDraft({...draft, intro: event.target.value})}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">Sections</h3>
                <Button type="button" variant="outline" onClick={addSection}>
                  Add section
                </Button>
              </div>
              {draft.sections.map((section, index) => (
                <div key={index} className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Section {index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={draft.sections.length <= 1}
                      onClick={() => removeSection(index)}
                    >
                      Remove
                    </Button>
                  </div>
                  <Input
                    label="Heading"
                    value={section.heading}
                    onChange={event => updateSection(index, {heading: event.target.value})}
                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                  />
                  <label className="mt-3 block text-sm font-medium text-foreground">
                    Body
                    <textarea
                      value={section.body}
                      onChange={event => updateSection(index, {body: event.target.value})}
                      dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      rows={4}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
              <Button type="button" variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </form>
        ) : doc ? (
          <article dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-6">
            <header>
              <h3 className="text-2xl font-bold text-foreground">{doc.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{doc.intro}</p>
            </header>
            <div className="space-y-5">
              {doc.sections.map((section, index) => (
                <section key={index}>
                  <h4 className="text-base font-semibold text-foreground">{section.heading}</h4>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {section.body}
                  </p>
                </section>
              ))}
            </div>
          </article>
        ) : null}
      </Card>
    </div>
  );
}
