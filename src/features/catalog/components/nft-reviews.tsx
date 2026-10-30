import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '@/components/query-states';
import { RatingStars } from '@/components/rating-stars';
import { Skeleton } from '@/components/ui/skeleton';
import { LOCALE } from '@/i18n/locale';
import { nftReviewsQueryOptions } from '../queries';

const dateFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' });

export function NftReviews({ nftId }: { nftId: string }) {
  const { data, error, isPending, refetch } = useQuery(nftReviewsQueryOptions(nftId));

  if (isPending) {
    return (
      <div aria-busy="true" className="grid gap-4">
        <span className="sr-only" role="status">
          Carregando avaliações
        </span>
        {[1, 2, 3].map((row) => (
          <Skeleton key={row} className="h-20 w-full" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <ErrorState
        title="Não foi possível carregar as avaliações"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }
  return (
    <ul className="grid gap-4">
      {data.map((review) => (
        <li key={review.id} className="grid gap-2 border-b border-primary/30 pb-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-bold">{review.author}</span>
            <RatingStars value={review.rating} className="text-highlight" />
            <time dateTime={review.createdAt} className="text-muted-foreground">
              {dateFormat.format(new Date(review.createdAt))}
            </time>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{review.comment}</p>
        </li>
      ))}
    </ul>
  );
}
