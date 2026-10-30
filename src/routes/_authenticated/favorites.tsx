import { createFileRoute } from '@tanstack/react-router';
import { FavoritesList } from '@/features/favorites/components/favorites-list';

export const Route = createFileRoute('/_authenticated/favorites')({
  head: () => ({ meta: [{ title: 'Favoritos · Kurio' }] }),
  component: FavoritesPage,
});

function FavoritesPage() {
  return (
    <div className="page-container grid gap-8 py-10">
      <h1 className="text-[28px] font-bold">Favoritos</h1>
      <FavoritesList />
    </div>
  );
}
