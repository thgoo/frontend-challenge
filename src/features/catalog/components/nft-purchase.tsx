import { EthAmount } from '@/components/eth-amount';
import { QuantityStepper } from '@/components/quantity-stepper';
import { Button } from '@/components/ui/button';
import type { Nft } from '@/contracts/nft';
import { AddToCartIconButton } from '@/features/cart/components/purchase-controls';
import {
  selectedPrice,
  type PurchaseActions,
  type PurchaseSelection,
} from '@/features/cart/use-purchase';
import { FavoriteButton } from '@/features/favorites/components/favorite-button';
import { formatEth } from '@/lib/eth';

interface PurchaseProps {
  selection: PurchaseSelection;
  actions: PurchaseActions;
}

export function DesktopPurchase({ nft, selection, actions }: PurchaseProps & { nft: Nft }) {
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

/** Fixed bottom bar on mobile, as in the Figma. */
export function MobileBuyBar({ selection, actions }: PurchaseProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid gap-5 rounded-t-[40px] bg-card px-6 pt-5 pb-[max(2.25rem,env(safe-area-inset-bottom))] shadow-[0_0_20px_rgb(10_6_4/0.45)] lg:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[15px] leading-4 font-medium text-muted-foreground">Qtd.</span>
          <QuantityStepper
            label="Quantidade"
            value={selection.quantity}
            max={Math.max(selection.remaining, 1)}
            disabled={selection.remaining === 0}
            onChange={selection.setQuantity}
          />
        </div>
        <p className="text-xl leading-4 font-bold text-highlight">
          <EthAmount value={formatEth(selectedPrice(selection))} />
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          disabled={actions.disabled}
          onClick={actions.buy}
          className="h-[60px] w-[196px] rounded-full bg-linear-to-br from-primary to-primary/80 text-base font-bold"
        >
          {actions.pending ? 'Comprando…' : 'Comprar NFT'}
        </Button>
        <AddToCartIconButton actions={actions} />
      </div>
    </div>
  );
}
