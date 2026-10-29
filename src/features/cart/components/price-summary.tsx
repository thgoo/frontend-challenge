import type { ReactNode } from 'react';
import { EthAmount } from '@/components/eth-amount';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { PriceSummary as Summary } from '@/contracts/pricing';
import { NETWORK_LABELS } from '@/lib/networks';

function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono">{children}</dd>
    </div>
  );
}

export function PriceSummary({ summary, feeLabel }: { summary: Summary; feeLabel?: string }) {
  return (
    <dl className="grid gap-3">
      <Row label="Subtotal">
        <EthAmount value={summary.subtotalEth} />
      </Row>
      {summary.coupon && (
        <Row label={`Discount (${summary.coupon.code})`}>
          −<EthAmount value={summary.discountEth} />
        </Row>
      )}
      <Row label={feeLabel ?? `Network fee (${NETWORK_LABELS[summary.network]})`}>
        <EthAmount value={summary.networkFeeEth} />
      </Row>
      <Separator />
      <div className="flex justify-between gap-4 text-lg font-semibold">
        <dt>Total</dt>
        <dd className="font-mono">
          <EthAmount value={summary.totalEth} />
        </dd>
      </div>
    </dl>
  );
}

export function PriceSummarySkeleton() {
  return (
    <div className="grid gap-3" aria-hidden="true">
      {[1, 2, 3].map((row) => (
        <div key={row} className="flex justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
      <Skeleton className="mt-2 h-7 w-full" />
    </div>
  );
}
