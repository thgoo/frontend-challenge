import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Nft } from '@/contracts/nft';
import { errorMessage } from '@/i18n/api-errors';
import { parseEth } from '@/lib/eth';
import { purchasableQuantity } from '@/lib/nft';
import { useAddCartItem, useCart } from './queries';

/** Edition and quantity chosen on the detail page, capped by stock, order limit and the cart. */
export function usePurchaseSelection(nft: Nft) {
  const { data: cart } = useCart();
  const firstAvailable = nft.editions.find((edition) => edition.available > 0) ?? nft.editions[0];
  const [editionId, setEditionId] = useState(firstAvailable?.id);
  const [requested, setRequested] = useState(1);

  const edition = nft.editions.find((candidate) => candidate.id === editionId) ?? firstAvailable;
  const inCart =
    cart?.lines.find((line) => line.nftId === nft.id && line.editionId === edition?.id)?.quantity ??
    0;
  const remaining = edition ? Math.max(0, purchasableQuantity(edition) - inCart) : 0;

  return {
    edition,
    inCart,
    remaining,
    quantity: Math.min(requested, Math.max(remaining, 1)),
    selectEdition: (id: string) => {
      setEditionId(id);
      setRequested(1);
    },
    setQuantity: setRequested,
    resetQuantity: () => {
      setRequested(1);
    },
  };
}

export type PurchaseSelection = ReturnType<typeof usePurchaseSelection>;

/** "Comprar" adds and goes to the cart; the cart button adds and stays, as in the Figma. */
export function usePurchaseActions(nft: Nft, selection: PurchaseSelection) {
  const navigate = useNavigate();
  const addItem = useAddCartItem();
  const { edition, quantity, remaining } = selection;

  const add = (onSuccess: () => void) => {
    if (!edition) return;
    addItem.mutate(
      { nftId: nft.id, editionId: edition.id, quantity },
      {
        onSuccess: () => {
          selection.resetQuantity();
          onSuccess();
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  return {
    disabled: remaining === 0 || addItem.isPending,
    pending: addItem.isPending,
    buy: () => {
      add(() => void navigate({ to: '/cart' }));
    },
    addToCart: () => {
      add(() =>
        toast.success(`${String(quantity)} × “${nft.name}” no carrinho.`, {
          action: { label: 'Ver carrinho', onClick: () => void navigate({ to: '/cart' }) },
        }),
      );
    },
  };
}

export type PurchaseActions = ReturnType<typeof usePurchaseActions>;

export function selectedPrice(selection: PurchaseSelection) {
  return selection.edition ? parseEth(selection.edition.priceEth) * BigInt(selection.quantity) : 0n;
}
