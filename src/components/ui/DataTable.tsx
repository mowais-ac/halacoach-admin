import type {ReactNode} from 'react';
import {cn} from '@/lib/cn';

export function DataTable({
  columns,
  children,
  className,
}: {
  columns: string[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-border bg-card', className)}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border bg-muted/60 text-muted-foreground">
          <tr>
            {columns.map(col => (
              <th key={col} className="px-4 py-3 font-semibold">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function FilterBar({children}: {children: ReactNode}) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>;
}
