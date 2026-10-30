import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/i18n/api-errors';

export function ErrorState({
  error,
  onRetry,
  title = 'Algo deu errado',
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-destructive/40 p-8 text-center"
    >
      <AlertCircle aria-hidden="true" className="size-8 text-destructive" />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children && <div className="text-muted-foreground">{children}</div>}
    </div>
  );
}
