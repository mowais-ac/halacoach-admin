'use client';

import Link from 'next/link';
import {useEffect, useState} from 'react';
import {ArrowLeft, ExternalLink} from 'lucide-react';
import {getConversation, isApiError, type ConversationDetail} from '@/api';
import {Badge} from '@/components/ui/Badge';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {ErrorState} from '@/components/ui/ErrorState';
import {LoadingState} from '@/components/ui/LoadingState';
import {PageHeader} from '@/components/ui/PageHeader';
import {cn} from '@/lib/cn';
import {formatMessageTime, messageAuthorLabels} from '@/lib/message-utils';

export function MessageThreadScreen({id}: {id: string}) {
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setConversation(await getConversation(id));
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not load conversation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  if (loading) {
    return <LoadingState label="Loading thread…" />;
  }

  if (error || !conversation) {
    return <ErrorState body={error ?? 'Conversation not found.'} onRetry={() => void load()} />;
  }

  return (
    <>
      <PageHeader
        module="M12"
        title={`${conversation.clientName} ↔ ${conversation.professionalName}`}
        description={conversation.professionalSpecialty}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Refresh
            </Button>
            <Link href="/messages">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" />
                Back to list
              </Button>
            </Link>
          </div>
        }
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge tone="sky">Live thread</Badge>
          {conversation.leadId ? <Badge tone="primary">From lead unlock</Badge> : null}
          <span className="text-muted-foreground">
            {conversation.messages.length} messages · started{' '}
            {formatMessageTime(conversation.createdAt)}
          </span>
          <Link
            href={`/clients/${conversation.clientId}`}
            className="inline-flex items-center gap-1 font-semibold text-primary">
            {conversation.clientName}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <span className="text-muted-foreground">↔</span>
          <Link
            href={`/professionals/${conversation.professionalId}`}
            className="inline-flex items-center gap-1 font-semibold text-primary">
            {conversation.professionalName}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          {conversation.leadId ? (
            <>
              <span className="text-muted-foreground">·</span>
              <Link
                href={`/leads/${conversation.leadId}`}
                className="inline-flex items-center gap-1 font-semibold text-primary">
                View lead
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </>
          ) : null}
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          {conversation.messages.map(message => {
            const isClient = message.author === 'client';
            const isSystem = message.author === 'system';
            return (
              <div
                key={message.id}
                className={cn(
                  'flex flex-col gap-1',
                  isClient ? 'items-end' : isSystem ? 'items-center' : 'items-start',
                )}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {!isClient && !isSystem ? (
                    <span>{messageAuthorLabels[message.author]}</span>
                  ) : null}
                  <span>{formatMessageTime(message.sentAt)}</span>
                  {isClient ? <span>{messageAuthorLabels.client}</span> : null}
                </div>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    isClient
                      ? 'rounded-br-md bg-primary text-white'
                      : isSystem
                        ? 'bg-muted text-muted-foreground'
                        : 'rounded-bl-md border border-border bg-muted/30 text-foreground',
                  )}>
                  {message.body}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
