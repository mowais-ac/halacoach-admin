'use client';

import Link from 'next/link';
import {useEffect, useMemo, useState} from 'react';
import {ChevronRight} from 'lucide-react';
import {isApiError, listConversations, type ConversationSummary} from '@/api';
import {Badge} from '@/components/ui/Badge';
import {Card} from '@/components/ui/Card';
import {DataTable} from '@/components/ui/DataTable';
import {EmptyState} from '@/components/ui/EmptyState';
import {ErrorState} from '@/components/ui/ErrorState';
import {LoadingState} from '@/components/ui/LoadingState';
import {PageHeader} from '@/components/ui/PageHeader';
import {formatMessageTime} from '@/lib/message-utils';

export function MessagesScreen() {
  const [rows, setRows] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listConversations());
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not load conversations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter(
      row =>
        row.clientName.toLowerCase().includes(q) ||
        row.professionalName.toLowerCase().includes(q) ||
        row.lastMessage.toLowerCase().includes(q),
    );
  }, [rows, query]);

  if (loading) {
    return <LoadingState label="Loading conversations…" />;
  }

  if (error) {
    return <ErrorState body={error} onRetry={() => void load()} />;
  }

  return (
    <>
      <PageHeader
        module="M12"
        title="Messages"
        description="Read-only stub of client ↔ coach threads. Sending and moderation arrive with halacoach-apis."
      />

      <Card className="mb-6 border-sky-200 bg-sky-50">
        <p className="text-sm text-foreground">
          View-only module — matches the mobile app demo thread. No reply, send, or delete actions
          in admin v1.
        </p>
      </Card>

      <div className="mb-4 flex justify-end">
        <input
          className="h-9 w-full max-w-sm rounded-xl border border-border px-3 text-sm"
          placeholder="Search client, coach, or message…"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No conversations match" body="Try clearing the search box." />
      ) : (
        <DataTable columns={['Participants', 'Last message', 'Messages', 'Updated', '']}>
          {visible.map(row => (
            <tr key={row.id} className="border-t border-border">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">
                  {row.clientName} ↔ {row.professionalName}
                </p>
                <p className="text-xs text-muted-foreground">{row.professionalSpecialty}</p>
              </td>
              <td className="max-w-md px-4 py-3">
                <p className="line-clamp-2 text-sm text-muted-foreground">{row.lastMessage}</p>
              </td>
              <td className="px-4 py-3">
                <Badge tone="muted">{row.messageCount}</Badge>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {formatMessageTime(row.lastMessageAt)}
              </td>
              <td className="px-4 py-3 text-end">
                <Link
                  href={`/messages/${row.id}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  View thread
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
