import { Link } from '@tanstack/react-router';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EthAmount } from '@/components/eth-amount';
import { NftImage } from '@/components/nft-image';
import { QuantityStepper } from '@/components/quantity-stepper';
import type { CartLine } from '@/contracts/cart';
import { errorMessage } from '@/i18n/api-errors';
import { formatEth, parseEth } from '@/lib/eth';
import { exceedsAvailability } from '../cart-lines';
import { useRemoveCartItem, useUpdateCartItem } from '../queries';

/** Desktop columns, shared with the cart table header. */
export const CART_COLUMNS = 'lg:grid-cols-[70px_minmax(0,1fr)_8.5rem_8.5rem_8.5rem_2.75rem]';

/** One markup for both layouts: a card on mobile and a table row on desktop. */
const LINE_LAYOUT = `grid grid-cols-[100px_minmax(0,1fr)_auto] gap-x-3 [grid-template-areas:'img_name_remove'_'img_edition_edition'_'img_total_qty'] lg:items-center lg:gap-x-4 lg:[grid-template-areas:'img_name_price_qty_total_remove'] ${CART_COLUMNS}`;

export function CartLineItem({ line }: { line: CartLine }) {
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const busy = update.isPending || remove.isPending;
  const max = Math.min(line.available, line.maxPerOrder);
  const key = { nftId: line.nftId, editionId: line.editionId };
  const lineTotal = formatEth(parseEth(line.unitPriceEth) * BigInt(line.quantity));
  const onError = (error: unknown) => {
    toast.error(errorMessage(error));
  };

  return (
    <li
      className={`overflow-hidden rounded-xl bg-card pr-3 lg:rounded-none lg:pr-4 ${LINE_LAYOUT}`}
    >
      <NftImage
        image={line.image}
        alt=""
        sizes="100px"
        className="size-full min-h-[100px] [grid-area:img] lg:size-[70px] lg:min-h-0"
      />
      <div className="grid min-w-0 gap-1 pt-3 [grid-area:name] lg:pt-0">
        <Link
          to="/nfts/$nftId"
          params={{ nftId: line.nftId }}
          className="truncate text-[15px] font-bold hover:text-highlight"
        >
          {line.nftName}
        </Link>
        <span className="hidden text-sm text-muted-foreground lg:block">
          ID do token: {line.tokenId}
        </span>
      </div>
      <span className="text-sm text-muted-foreground [grid-area:edition] lg:hidden">
        Edição: {line.editionName}
      </span>
      <p className="hidden text-base font-bold text-highlight [grid-area:price] lg:block">
        <span className="sr-only">Preço unitário: </span>
        <EthAmount value={line.unitPriceEth} />
      </p>
      <div className="self-end pb-3 [grid-area:qty] lg:self-center lg:pb-0">
        <QuantityStepper
          size="sm"
          label={`Quantidade de ${line.nftName}`}
          value={line.quantity}
          max={Math.max(max, 1)}
          disabled={busy || max === 0}
          onChange={(quantity) => {
            update.mutate({ ...key, quantity }, { onError });
          }}
        />
      </div>
      <p className="self-end pb-3 text-lg font-bold text-highlight [grid-area:total] lg:self-center lg:pb-0 lg:text-base">
        <span className="sr-only">Total do item: </span>
        <EthAmount value={lineTotal} />
      </p>
      <button
        type="button"
        disabled={busy}
        aria-label={`Remover ${line.nftName} (${line.editionName}) do carrinho`}
        onClick={() => {
          remove.mutate(key, { onError });
        }}
        className="mt-2 grid size-9 place-items-center justify-self-end rounded-md text-highlight [grid-area:remove] hover:bg-accent disabled:opacity-50 lg:mt-0"
      >
        <Trash2 aria-hidden="true" className="size-5" />
      </button>
      {exceedsAvailability(line) && (
        <p
          role="alert"
          className="col-span-full flex items-center gap-1 px-3 pb-3 text-sm text-destructive lg:px-0"
        >
          <AlertTriangle aria-hidden="true" className="size-4" />
          {line.available === 0
            ? 'Esgotado. Remova o item para continuar.'
            : `Apenas ${String(line.available)} disponíveis agora.`}
        </p>
      )}
    </li>
  );
}
