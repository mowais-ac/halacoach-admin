import {Inbox} from 'lucide-react';

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Inbox size={20} strokeWidth={1.7} />
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      {body ? <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p> : null}
    </div>
  );
}
