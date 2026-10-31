import { cn } from 'cn';
import { StarIcon } from '@/components/icons';
import { formatRating } from '@/i18n/locale';

export function RatingStars({ value, className }: { value: number; className?: string }) {
  const filled = Math.round(value);
  return (
    <span
      role="img"
      aria-label={`Avaliação ${formatRating(value)} de 5`}
      className={cn('inline-flex gap-0.5', className)}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon key={index} className={cn('size-3.5', index >= filled && 'opacity-40')} />
      ))}
    </span>
  );
}
