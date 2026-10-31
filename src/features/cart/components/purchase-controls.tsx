import { cn } from 'cn';
import { RadioGroup } from 'radix-ui';
import { useId } from 'react';
import { ShopIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import type { Nft } from '@/contracts/nft';
import type { PurchaseActions, PurchaseSelection } from '../use-purchase';

/** Rarest first, as the Figma lists the chips. */
function bySupply(nft: Nft) {
  return [...nft.editions].sort((a, b) => a.supply - b.supply);
}

export function EditionPicker({ nft, selection }: { nft: Nft; selection: PurchaseSelection }) {
  const labelId = useId();
  const { edition } = selection;
  return (
    <div className="grid gap-2 lg:gap-3">
      <p id={labelId} className="text-[15px] leading-4 font-bold">
        Edição:
      </p>
      <RadioGroup.Root
        aria-labelledby={labelId}
        value={edition?.id}
        onValueChange={selection.selectEdition}
        className="flex flex-wrap gap-3 lg:gap-1.5"
      >
        {bySupply(nft).map((option) => {
          const soldOut = option.available === 0;
          return (
            <RadioGroup.Item
              key={option.id}
              value={option.id}
              disabled={soldOut}
              aria-label={`${option.name}${soldOut ? ', esgotada' : ''}`}
              className={cn(
                'h-7 rounded-full border border-border px-1.5 text-sm leading-4 text-muted-foreground uppercase focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                'data-[state=checked]:border-primary data-[state=checked]:font-medium data-[state=checked]:text-highlight',
                soldOut && 'line-through opacity-50',
              )}
            >
              {option.name}
            </RadioGroup.Item>
          );
        })}
      </RadioGroup.Root>
      {edition && (
        <p className="text-xs text-muted-foreground">
          {edition.available === 0
            ? 'Esta edição está esgotada.'
            : `${String(edition.available)} de ${String(edition.supply)} disponíveis`}
        </p>
      )}
    </div>
  );
}

export function PurchaseLimitNotice({ selection }: { selection: PurchaseSelection }) {
  if (selection.remaining > 0 || !selection.edition || selection.edition.available === 0) {
    return null;
  }
  return (
    <p role="status" className="text-sm text-muted-foreground">
      Você já tem o máximo permitido desta edição no carrinho.
    </p>
  );
}

export function AddToCartIconButton({ actions }: { actions: PurchaseActions }) {
  return (
    <Button
      variant="ghost"
      aria-label="Adicionar ao carrinho"
      disabled={actions.disabled}
      onClick={actions.addToCart}
      className="size-[60px] rounded-full border border-border bg-muted text-subtle hover:bg-accent"
    >
      <ShopIcon />
    </Button>
  );
}
