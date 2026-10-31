import { cn } from 'cn';

export function CartBadge({
  count,
  className = '-top-1.5 -right-2',
}: {
  count: number;
  className?: string;
}) {
  if (count === 0) return null;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute grid size-4 place-items-center rounded-full border-2 border-background bg-primary text-[10px] font-medium text-primary-foreground',
        className,
      )}
    >
      {count}
    </span>
  );
}
