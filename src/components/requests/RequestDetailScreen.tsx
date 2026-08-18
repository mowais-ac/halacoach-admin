'use client';

import Link from 'next/link';
import {FormEvent, useEffect, useState, type ReactNode} from 'react';
import {ArrowLeft, ExternalLink} from 'lucide-react';
import {
  getQuoteRequest,
  isApiError,
  updateQuoteRequest,
  type QuoteRequestDetail,
  type SessionUser,
} from '@/api';
import {Badge} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {ConfirmDialog} from '@/components/ui/ConfirmDialog';
import {ErrorState} from '@/components/ui/ErrorState';
import {Input} from '@/components/ui/Input';
import {LoadingState} from '@/components/ui/LoadingState';
import {PageHeader} from '@/components/ui/PageHeader';
import {quoteStatusLabels, quoteStatusTone} from '@/lib/request-utils';
import {can} from '@/lib/permissions';

function Section({title, children}: {title: string; children: ReactNode}) {
  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </Card>
  );
}

function Field({label, value}: {label: string; value: ReactNode}) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function RequestDetailScreen({actor, id}: {actor: SessionUser; id: string}) {
  const canWrite = can(actor.role, 'requests:write');
  const [request, setRequest] = useState<QuoteRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await getQuoteRequest(id);
      setRequest(detail);
      setQuoteMessage(detail.quoteMessage ?? '');
      setQuoteAmount(detail.quoteAmount ?? 'Quote on request');
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not load quote request.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const saveQuote = async (event: FormEvent) => {
    event.preventDefault();
    if (!request) {
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const updated = await updateQuoteRequest(request.id, {
        status: 'quoted',
        quoteMessage,
        quoteAmount,
      });
      setRequest(updated);
      setShowQuoteForm(false);
    } catch (err) {
      setFormError(isApiError(err) ? err.message : 'Could not save quote.');
    } finally {
      setSaving(false);
    }
  };

  const closeRequest = async () => {
    if (!request) {
      return;
    }
    try {
      const updated = await updateQuoteRequest(request.id, {status: 'closed'});
      setRequest(updated);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not close request.');
    } finally {
      setPendingClose(false);
    }
  };

  const reopenRequest = async () => {
    if (!request) {
      return;
    }
    try {
      const updated = await updateQuoteRequest(request.id, {
        status: request.quoteMessage ? 'quoted' : 'pending',
      });
      setRequest(updated);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not reopen request.');
    }
  };

  if (loading) {
    return <LoadingState label="Loading quote request…" />;
  }

  if (error || !request) {
    return <ErrorState body={error ?? 'Quote request not found.'} onRetry={() => void load()} />;
  }

  return (
    <>
      <div className="mb-4">
        <Link
          href="/requests"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
          Back to requests
        </Link>
      </div>

      <PageHeader
        module="M8"
        title={`${request.clientName} → ${request.professionalName}`}
        description={request.professionalSpecialty}
        actions={
          canWrite ? (
            <div className="flex flex-wrap gap-2">
              {request.status === 'pending' ? (
                <Button variant="outline" onClick={() => setShowQuoteForm(value => !value)}>
                  {showQuoteForm ? 'Cancel quote' : 'Mark as quoted'}
                </Button>
              ) : null}
              {request.status !== 'closed' ? (
                <Button variant="destructive" onClick={() => setPendingClose(true)}>
                  Close request
                </Button>
              ) : (
                <Button variant="outline" onClick={() => void reopenRequest()}>
                  Reopen
                </Button>
              )}
            </div>
          ) : null
        }
      />

      <div className="mb-6">
        <Badge tone={quoteStatusTone(request.status)}>
          {quoteStatusLabels[request.status]}
        </Badge>
      </div>

      {showQuoteForm && canWrite ? (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">Coach quote</h2>
          <form onSubmit={saveQuote} className="space-y-4">
            <Input
              label="Amount / pricing note"
              value={quoteAmount}
              onChange={event => setQuoteAmount(event.target.value)}
            />
            <label className="block text-sm">
              <span className="font-medium">Message to client</span>
              <textarea
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                rows={4}
                required
                value={quoteMessage}
                onChange={event => setQuoteMessage(event.target.value)}
                placeholder="Describe the proposed plan, sessions, and next steps…"
              />
            </label>
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save quote'}
            </Button>
          </form>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Client">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={request.clientName} />
            <Field label="Email" value={request.clientEmail} />
            <Field label="Phone" value={request.clientPhone} />
            <Field label="Requested" value={new Date(request.createdAt).toLocaleString()} />
          </dl>
          <Link
            href={`/clients/${request.clientId}`}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View client profile
            <ExternalLink size={14} />
          </Link>
        </Section>

        <Section title="Coach">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={request.professionalName} />
            <Field label="Specialty" value={request.professionalSpecialty} />
          </dl>
          <Link
            href={`/professionals/${request.professionalId}`}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View coach profile
            <ExternalLink size={14} />
          </Link>
        </Section>

        <Section title="Quote">
          {request.status === 'pending' ? (
            <p className="text-sm text-muted-foreground">
              The coach has not replied yet. The client is waiting for a quote.
            </p>
          ) : (
            <>
              <Field label="Pricing" value={request.quoteAmount ?? '—'} />
              <p className="mt-3 text-sm leading-relaxed text-foreground">
                {request.quoteMessage ?? '—'}
              </p>
              {request.quotedAt ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Quoted {new Date(request.quotedAt).toLocaleString()}
                </p>
              ) : null}
            </>
          )}
        </Section>

        <Section title="Timeline">
          <ul className="space-y-2 text-sm">
            <li>
              <span className="text-muted-foreground">Created · </span>
              {new Date(request.createdAt).toLocaleString()}
            </li>
            {request.quotedAt ? (
              <li>
                <span className="text-muted-foreground">Quoted · </span>
                {new Date(request.quotedAt).toLocaleString()}
              </li>
            ) : null}
            {request.closedAt ? (
              <li>
                <span className="text-muted-foreground">Closed · </span>
                {new Date(request.closedAt).toLocaleString()}
              </li>
            ) : null}
          </ul>
        </Section>
      </div>

      <ConfirmDialog
        open={pendingClose}
        title="Close this request?"
        body="The client and coach will see this request as closed in the app."
        confirmLabel="Close request"
        destructive
        onClose={() => setPendingClose(false)}
        onConfirm={() => void closeRequest()}
      />
    </>
  );
}
