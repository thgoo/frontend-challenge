import { ShopIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import type { PurchaseActions } from '../use-purchase';

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
