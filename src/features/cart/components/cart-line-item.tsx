import { Link } from '@tanstack/react-router';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EthAmount } from '@/components/eth-amount';
import { QuantityStepper } from '@/components/quantity-stepper';
import { Button } from '@/components/ui/button';
import type { CartLine } from '@/contracts/cart';
import { toApiRequestError } from '@/lib/api-error';
import { formatEth, parseEth } from '@/lib/eth';
import { exceedsAvailability } from '../cart-lines';
import { useRemoveCartItem, useUpdateCartItem } from '../queries';

export function CartLineItem({ line }: { line: CartLine }) {
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const busy = update.isPending || remove.isPending;
  const max = Math.min(line.available, line.maxPerOrder);
  const key = { nftId: line.nftId, editionId: line.editionId };
  const onError = (error: unknown) => {
    toast.error(toApiRequestError(error).message);
  };

  return (
    <li className="grid grid-cols-[5rem_1fr] gap-4 rounded-2xl bg-card p-4 sm:grid-cols-[6rem_1fr_auto]">
      <img
        src={line.imageUrl}
        alt=""
        width={96}
        height={96}
        className="aspect-square w-full rounded-lg object-cover"
      />
      <div className="grid content-start gap-1">
        <Link
          to="/nfts/$nftId"
          params={{ nftId: line.nftId }}
          className="font-semibold hover:underline"
        >
          {line.nftName}
        </Link>
        <span className="text-sm text-muted-foreground">{line.editionName} edition</span>
        <EthAmount value={line.unitPriceEth} className="font-mono text-sm" />
        {exceedsAvailability(line) && (
          <p role="alert" className="flex items-center gap-1 text-sm text-destructive">
            <AlertTriangle aria-hidden="true" className="size-4" />
            {line.available === 0
              ? 'Sold out. Remove it to continue.'
              : `Only ${line.available} available now.`}
          </p>
        )}
      </div>
      <div className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:grid sm:justify-items-end">
        <QuantityStepper
          label={`Quantity of ${line.nftName}`}
          value={line.quantity}
          max={Math.max(max, 1)}
          disabled={busy || max === 0}
          onChange={(quantity) => {
            update.mutate({ ...key, quantity }, { onError });
          }}
        />
        <EthAmount
          value={formatEth(parseEth(line.unitPriceEth) * BigInt(line.quantity))}
          className="font-mono font-semibold"
        />
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          aria-label={`Remove ${line.nftName} (${line.editionName}) from cart`}
          onClick={() => {
            remove.mutate(key, { onError });
          }}
        >
          <Trash2 aria-hidden="true" />
          Remove
        </Button>
      </div>
    </li>
  );
}
