'use client';

import Link from 'next/link';
import {useEffect, useMemo, useState} from 'react';
import {ChevronRight} from 'lucide-react';
import {isApiError, listQuoteRequests, type QuoteRequestSummary, type SessionUser} from '@/api';
import {Badge} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import {DataTable, FilterBar} from '@/components/ui/DataTable';
import {EmptyState} from '@/components/ui/EmptyState';
import {ErrorState} from '@/components/ui/ErrorState';
import {LoadingState} from '@/components/ui/LoadingState';
import {PageHeader} from '@/components/ui/PageHeader';
import {quoteStatusLabels, quoteStatusTone} from '@/lib/request-utils';

type Filter = 'all' | 'pending' | 'quoted' | 'closed';

export function RequestsScreen({actor}: {actor: SessionUser}) {
  const [rows, setRows] = useState<QuoteRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listQuoteRequests());
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not load quote requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(row => {
      if (filter !== 'all' && row.status !== filter) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        row.clientName.toLowerCase().includes(q) ||
        row.professionalName.toLowerCase().includes(q) ||
        row.professionalSpecialty.toLowerCase().includes(q)
      );
    });
  }, [rows, filter, query]);

  const counts = useMemo(
    () => ({
      all: rows.length,
      pending: rows.filter(row => row.status === 'pending').length,
      quoted: rows.filter(row => row.status === 'quoted').length,
      closed: rows.filter(row => row.status === 'closed').length,
    }),
    [rows],
  );

  if (loading) {
    return <LoadingState label="Loading quote requests…" />;
  }

  if (error) {
    return <ErrorState body={error} onRetry={() => void load()} />;
  }

  return (
    <>
      <PageHeader
        module="M8"
        title="Requests"
        description="Quote requests between clients and coaches — pending, quoted, or closed."
      />

      <FilterBar>
        {(
          [
            ['all', 'All'],
            ['pending', 'Pending'],
            ['quoted', 'Quoted'],
            ['closed', 'Closed'],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            variant={filter === key ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter(key)}>
            {label} ({counts[key]})
          </Button>
        ))}
        <input
          className="ms-auto h-9 min-w-[200px] rounded-xl border border-border px-3 text-sm"
          placeholder="Search client or coach…"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
      </FilterBar>

      {visible.length === 0 ? (
        <EmptyState title="No requests match" body="Try another filter or clear the search box." />
      ) : (
        <DataTable columns={['Client', 'Coach', 'Status', 'Requested', '']}>
          {visible.map(row => (
            <tr key={row.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">{row.clientName}</td>
              <td className="px-4 py-3">
                <div className="font-medium text-foreground">{row.professionalName}</div>
                <div className="text-xs text-muted-foreground">{row.professionalSpecialty}</div>
              </td>
              <td className="px-4 py-3">
                <Badge tone={quoteStatusTone(row.status)}>{quoteStatusLabels[row.status]}</Badge>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {new Date(row.createdAt).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-end">
                <Link
                  href={`/requests/${row.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  View
                  <ChevronRight size={16} />
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Signed in as {actor.name} ({actor.role}).
      </p>
    </>
  );
}
