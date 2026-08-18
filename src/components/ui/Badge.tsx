import type {ReactNode} from 'react';
import {cn} from '@/lib/cn';

type Tone = 'primary' | 'coral' | 'sky' | 'muted' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  primary: 'bg-primary-soft text-primary-deep',
  coral: 'bg-coral-soft text-coral',
  sky: 'bg-sky-soft text-foreground',
  muted: 'bg-muted text-muted-foreground',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-50 text-destructive',
};

export function Badge({
  children,
  tone = 'muted',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}>
      {children}
    </span>
  );
}
