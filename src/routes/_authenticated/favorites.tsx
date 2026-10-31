import { createFileRoute } from '@tanstack/react-router';
import { AccountLayout } from '@/features/account/components/account-layout';
import { FavoriteNfts } from '@/features/catalog/components/favorite-nfts';

export const Route = createFileRoute('/_authenticated/favorites')({
  head: () => ({ meta: [{ title: 'Lista de interesse · Kurio' }] }),
  component: FavoritesPage,
});

function FavoritesPage() {
  return (
    <AccountLayout>
      <h1 className="text-[17px] font-bold">Lista de interesse</h1>
      <FavoriteNfts />
    </AccountLayout>
  );
}
