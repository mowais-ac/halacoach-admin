import {Button} from './Button';

export function ErrorState({
  title = 'Something went wrong',
  body,
  onRetry,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-16 text-center">
      <p className="font-semibold text-destructive">{title}</p>
      {body ? <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p> : null}
      {onRetry ? (
        <Button className="mt-4" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
