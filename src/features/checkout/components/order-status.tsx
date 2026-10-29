import { Link } from '@tanstack/react-router';
import { CheckCircle2, ExternalLink, Loader2, XCircle } from 'lucide-react';
import { EthAmount } from '@/components/eth-amount';
import { Button } from '@/components/ui/button';
import type { Order } from '@/contracts/order';
import { PriceSummary } from '@/features/cart/components/price-summary';
import { NETWORK_LABELS } from '@/lib/networks';
import { shortenAddress } from '@/lib/wallets';

function PendingOrder({ order }: { order: Order }) {
  return (
    <section
      role="status"
      className="grid justify-items-center gap-4 rounded-2xl bg-card p-10 text-center"
    >
      <Loader2
        aria-hidden="true"
        className="size-10 animate-spin text-primary motion-reduce:animate-none"
      />
      <h1 className="text-2xl font-semibold">Waiting for payment confirmation</h1>
      <p className="max-w-md text-muted-foreground">
        Order {order.id} was submitted. You can safely refresh or come back later: this page updates
        on its own.
      </p>
    </section>
  );
}

function DeclinedOrder({ order }: { order: Order }) {
  return (
    <section
      role="alert"
      className="grid justify-items-center gap-4 rounded-2xl bg-card p-10 text-center"
    >
      <XCircle aria-hidden="true" className="size-10 text-destructive" />
      <h1 className="text-2xl font-semibold">Payment declined</h1>
      <p className="max-w-md text-muted-foreground">
        {order.failureReason ?? 'The payment could not be completed.'} Your cart was kept, so you
        can try again.
      </p>
      <Button asChild>
        <Link to="/checkout">Back to checkout</Link>
      </Button>
    </section>
  );
}

/** Renders only the immutable receipt snapshot, never live catalog data. */
function Receipt({ order }: { order: Order }) {
  const { receipt } = order;
  return (
    <article className="grid gap-8 rounded-2xl bg-card p-6 sm:p-10">
      <header className="grid gap-3">
        <p role="status" className="flex items-center gap-2 text-emerald-400">
          <CheckCircle2 aria-hidden="true" />
          Payment confirmed
        </p>
        <h1 className="text-3xl font-semibold">Thank you for your purchase</h1>
        <dl className="grid gap-1 text-sm">
          <div className="flex flex-wrap gap-2">
            <dt className="text-muted-foreground">Order:</dt>
            <dd className="font-mono">{order.id}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-muted-foreground">Transaction:</dt>
            <dd className="font-mono break-all">{order.txHash}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="text-muted-foreground">Paid from:</dt>
            <dd className="font-mono">
              {shortenAddress(order.walletAddress)} on {NETWORK_LABELS[receipt.network]}
            </dd>
          </div>
        </dl>
        {order.explorerUrl && (
          <a
            href={order.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary underline underline-offset-4"
          >
            View on block explorer (simulated transaction)
            <ExternalLink aria-hidden="true" className="size-4" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </header>
      <section aria-labelledby="receipt-items" className="grid gap-3">
        <h2 id="receipt-items" className="text-lg font-semibold">
          Items
        </h2>
        <ul className="grid gap-3">
          {receipt.lines.map((line) => (
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
      </section>
      <PriceSummary summary={receipt} />
      <Button asChild variant="outline" className="justify-self-start">
        <Link to="/">Continue browsing</Link>
      </Button>
    </article>
  );
}

export function OrderStatus({ order }: { order: Order }) {
  switch (order.status) {
    case 'pending':
      return <PendingOrder order={order} />;
    case 'declined':
      return <DeclinedOrder order={order} />;
    case 'confirmed':
      return <Receipt order={order} />;
  }
}
