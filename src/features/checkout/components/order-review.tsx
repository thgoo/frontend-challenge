import { AlertTriangle } from 'lucide-react';
import { EthAmount } from '@/components/eth-amount';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { Quote } from '@/contracts/quote';
import type { Wallet } from '@/contracts/wallet';
import { PriceSummary } from '@/features/cart/components/price-summary';
import { shortenAddress } from '@/lib/wallets';
import type { CheckoutDetails } from '../checkout-details';

interface OrderReviewProps {
  quote: Quote;
  details: CheckoutDetails;
  wallet: Wallet | undefined;
  stale: boolean;
  placing: boolean;
  refreshing: boolean;
  onPlaceOrder: () => void;
  onRefreshQuote: () => void;
  onEdit: () => void;
}

export function OrderReview(props: OrderReviewProps) {
  const { quote, details, wallet, stale, placing, refreshing } = props;

  return (
    <section aria-labelledby="review-heading" className="grid gap-6">
      <h2 id="review-heading" className="text-xl font-semibold">
        Review your order
      </h2>
      {stale && (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle>Prices or availability changed</AlertTitle>
          <AlertDescription className="grid gap-3">
            <p>
              This review is out of date. Refresh it to see the current total before confirming.
            </p>
            <Button
              variant="outline"
              disabled={refreshing}
              onClick={props.onRefreshQuote}
              className="justify-self-start"
            >
              {refreshing ? 'Refreshing…' : 'Refresh review'}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <ul className="grid gap-3">
        {quote.lines.map((line) => (
          <li key={`${line.nftId}:${line.editionId}`} className="flex items-center gap-4">
            <img
              src={line.imageUrl}
              alt=""
              width={56}
              height={56}
              className="size-14 rounded-lg object-cover"
            />
            <div className="grid flex-1">
              <span className="font-medium">{line.nftName}</span>
              <span className="text-sm text-muted-foreground">
                {line.editionName} · {line.quantity} × <EthAmount value={line.unitPriceEth} />
              </span>
            </div>
            <EthAmount value={line.lineTotalEth} className="font-mono" />
          </li>
        ))}
      </ul>
      <PriceSummary summary={quote} />
      <dl className="grid gap-1 text-sm">
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Collector:</dt>
          <dd>
            {details.fullName} ({details.email}), {details.country}
          </dd>
        </div>
        {wallet && (
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Wallet:</dt>
            <dd className="font-mono">
              {wallet.label} · {shortenAddress(wallet.address)}
            </dd>
          </div>
        )}
      </dl>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={props.onEdit} disabled={placing}>
          Edit details
        </Button>
        <Button size="lg" onClick={props.onPlaceOrder} disabled={stale || placing}>
          {placing ? 'Placing order…' : 'Confirm and pay'}
        </Button>
      </div>
    </section>
  );
}
