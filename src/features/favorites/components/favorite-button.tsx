import { useNavigate, useRouterState } from '@tanstack/react-router';
import { cn } from 'cn';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useSession } from '@/features/auth/queries';
import { useFavorites, useToggleFavorite } from '../queries';

interface FavoriteButtonProps {
  nftId: string;
  nftName: string;
  /** `icon` is the compact heart used on cards and image overlays. */
  variant?: 'full' | 'icon';
  className?: string;
}

export function FavoriteButton({
  nftId,
  nftName,
  variant = 'full',
  className,
}: FavoriteButtonProps) {
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
          toast.error(
            `Não foi possível atualizar os favoritos de “${nftName}”. Desfizemos a alteração.`,
          );
        },
      },
    );
  };

  const heart = (
    <Heart aria-hidden="true" className={cn(isFavorite && 'fill-primary text-primary')} />
  );

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-pressed={isFavorite}
        aria-label={`Favoritar ${nftName}`}
        onClick={onClick}
        className={cn('bg-background/80 hover:bg-background', className)}
      >
        {heart}
      </Button>
    );
  }

  return (
    <Button variant="outline" aria-pressed={isFavorite} onClick={onClick} className={className}>
      {heart}
      {isFavorite ? 'Favoritado' : 'Favoritar'}
    </Button>
  );
}
