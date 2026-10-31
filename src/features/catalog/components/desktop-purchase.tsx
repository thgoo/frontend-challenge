import { QuantityStepper } from '@/components/quantity-stepper';
import { Button } from '@/components/ui/button';
import type { Nft } from '@/contracts/nft';
import type { PurchaseActions, PurchaseSelection } from '@/features/cart/use-purchase';
import { FavoriteButton } from '@/features/favorites/components/favorite-button';

interface DesktopPurchaseProps {
  nft: Nft;
  selection: PurchaseSelection;
  actions: PurchaseActions;
}

export function DesktopPurchase({ nft, selection, actions }: DesktopPurchaseProps) {
  return (
    <div className="hidden flex-wrap items-center justify-between gap-4 lg:flex">
      <QuantityStepper
        size="lg"
        label="Quantidade"
        value={selection.quantity}
        max={Math.max(selection.remaining, 1)}
        disabled={selection.remaining === 0}
        onChange={selection.setQuantity}
      />
      <div className="flex gap-2">
        <Button
          disabled={actions.disabled}
          onClick={actions.buy}
          className="h-10 w-[130px] text-sm font-bold"
        >
          {actions.pending ? 'Comprando…' : 'COMPRAR'}
        </Button>
        <FavoriteButton
          nftId={nft.id}
          nftName={nft.name}
          className="h-10 w-[130px] border-primary font-medium text-highlight [&_svg]:size-5"
        />
      </div>
    </div>
  );
}
