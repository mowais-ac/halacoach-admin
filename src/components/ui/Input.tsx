import type {InputHTMLAttributes} from 'react';
import {cn} from '@/lib/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({label, error, className, id, ...props}: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="block text-sm font-medium text-foreground" htmlFor={inputId}>
      {label}
      <input
        id={inputId}
        className={cn(
          'mt-1.5 h-11 w-full rounded-xl border bg-background px-3 text-sm font-normal outline-none focus:border-primary',
          error ? 'border-destructive' : 'border-border',
          className,
        )}
        {...props}
      />
      {error ? (
        <span className="mt-1 block text-xs font-normal text-destructive">{error}</span>
      ) : null}
    </label>
  );
}
