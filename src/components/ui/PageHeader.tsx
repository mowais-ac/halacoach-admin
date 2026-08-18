import type {ReactNode} from 'react';
import {Badge} from './Badge';

export function PageHeader({
  title,
  description,
  module,
  actions,
}: {
  title: string;
  description?: string;
  module?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {module ? <Badge tone="sky">{module}</Badge> : null}
        </div>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}
