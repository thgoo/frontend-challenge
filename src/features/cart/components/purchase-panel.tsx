import { useNavigate } from '@tanstack/react-router';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { EthAmount } from '@/components/eth-amount';
import { QuantityStepper } from '@/components/quantity-stepper';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Nft } from '@/contracts/nft';
import { toApiRequestError } from '@/lib/api-error';
import { purchasableQuantity } from '@/lib/nft';
import { useAddCartItem, useCart } from '../queries';

export function PurchasePanel({ nft }: { nft: Nft }) {
  const navigate = useNavigate();
  const { data: cart } = useCart();
  const addItem = useAddCartItem();
  const groupId = useId();
  const firstAvailable = nft.editions.find((edition) => edition.available > 0) ?? nft.editions[0];
  const [editionId, setEditionId] = useState(firstAvailable?.id);
  const [requested, setRequested] = useState(1);

  const edition = nft.editions.find((candidate) => candidate.id === editionId);
  if (!edition) return null;

  const inCart =
    cart?.lines.find((line) => line.nftId === nft.id && line.editionId === edition.id)?.quantity ??
    0;
  const remaining = Math.max(0, purchasableQuantity(edition) - inCart);
  const quantity = Math.min(requested, Math.max(remaining, 1));

  const addToCart = () => {
    addItem.mutate(
      { nftId: nft.id, editionId: edition.id, quantity },
      {
        onSuccess: () => {
          setRequested(1);
          toast.success(`Added ${quantity} × “${nft.name}” to your cart.`, {
            action: { label: 'View cart', onClick: () => void navigate({ to: '/cart' }) },
          });
        },
        onError: (error) => {
          toast.error(toApiRequestError(error).message);
        },
      },
    );
  };

  return (
    <div className="grid gap-6 rounded-2xl bg-card p-6">
      <fieldset className="grid gap-3">
        <legend id={groupId} className="mb-2 font-semibold">
          Edition
        </legend>
        <RadioGroup
          aria-labelledby={groupId}
          value={edition.id}
          onValueChange={(value) => {
            setEditionId(value);
            setRequested(1);
          }}
        >
          {nft.editions.map((option) => {
            const soldOut = option.available === 0;
            return (
              <div
                key={option.id}
                className="flex items-center justify-between gap-4 rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem id={option.id} value={option.id} disabled={soldOut} />
                  <Label htmlFor={option.id} className="grid gap-1">
                    <span>{option.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {soldOut ? 'Sold out' : `${option.available} of ${option.supply} available`}
                    </span>
                  </Label>
                </div>
                <EthAmount value={option.priceEth} className="font-mono" />
              </div>
            );
          })}
        </RadioGroup>
      </fieldset>

      {remaining > 0 ? (
        <div className="flex flex-wrap items-center gap-4">
          <QuantityStepper
            label="Quantity"
            value={quantity}
            max={remaining}
            onChange={setRequested}
          />
          <span className="text-sm text-muted-foreground">
            Up to {remaining} more {inCart > 0 && `(you have ${inCart} in your cart)`}
          </span>
        </div>
      ) : (
        <p role="status" className="text-sm text-muted-foreground">
          {edition.available === 0
            ? 'This edition is sold out.'
            : 'You already have the maximum allowed for this edition in your cart.'}
        </p>
      )}

      <Button size="lg" disabled={remaining === 0 || addItem.isPending} onClick={addToCart}>
        {addItem.isPending ? 'Adding…' : 'Add to cart'}
      </Button>
    </div>
  );
}
