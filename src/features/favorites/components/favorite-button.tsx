import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useSession } from '@/features/auth/queries';
import { useFavorites, useToggleFavorite } from '../queries';

export function FavoriteButton({ nftId, nftName }: { nftId: string; nftName: string }) {
  const session = useSession();
  const navigate = useNavigate();
  const currentHref = useRouterState({ select: (state) => state.location.href });
  const { data } = useFavorites();
  const toggle = useToggleFavorite();
  const isFavorite = data?.nftIds.includes(nftId) ?? false;

  const onClick = () => {
    if (!session) {
      void navigate({ to: '/login', search: { redirect: currentHref } });
      return;
    }
    toggle.mutate(
      { nftId, favorite: !isFavorite },
      {
        onError: () => {
          toast.error(`Could not update favorites for “${nftName}”. Your change was undone.`);
        },
      },
    );
  };

  return (
    <Button variant="outline" aria-pressed={isFavorite} onClick={onClick}>
      <Heart aria-hidden="true" className={isFavorite ? 'fill-primary text-primary' : undefined} />
      {isFavorite ? 'Favorited' : 'Add to favorites'}
    </Button>
  );
}
