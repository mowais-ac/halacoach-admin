import {ShieldOff} from 'lucide-react';

export function Forbidden({
  title = 'You don’t have access',
  body = 'This area is limited to another admin role.',
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-20 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-coral-soft text-coral">
        <ShieldOff size={20} strokeWidth={1.7} />
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
