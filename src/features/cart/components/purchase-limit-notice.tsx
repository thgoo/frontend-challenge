import type { PurchaseSelection } from '../use-purchase';

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
