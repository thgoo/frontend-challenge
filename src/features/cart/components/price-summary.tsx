import type { ReactNode } from 'react';
import { EthAmount } from '@/components/eth-amount';
import { Skeleton } from '@/components/ui/skeleton';
import type { PriceSummary as Summary } from '@/contracts/pricing';
import { NETWORK_LABELS } from '@/lib/networks';

function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{label}</dt>
      <dd className="text-right text-base whitespace-nowrap">{children}</dd>
    </div>
  );
}

interface PriceSummaryProps {
  summary: Summary;
  /** Before a quote the fee is only an estimate; quotes and receipts show the final fee. */
  estimatedFee?: boolean;
}

export function PriceSummary({ summary, estimatedFee = false }: PriceSummaryProps) {
  return (
    <dl className="grid gap-3 text-[15px]">
      <Row label="Subtotal">
        <EthAmount value={summary.subtotalEth} />
      </Row>
      <Row label={summary.coupon ? `Desconto (${summary.coupon.code})` : 'Desconto do lançamento'}>
        (-) <EthAmount value={summary.discountEth} />
      </Row>
      <div className="grid gap-1">
        <Row
          label={
            estimatedFee ? 'Taxa de rede' : `Taxa de rede (${NETWORK_LABELS[summary.network]})`
          }
        >
          <EthAmount value={summary.networkFeeEth} />
        </Row>
        {estimatedFee && <p className="text-right text-xs text-highlight">Taxa estimada</p>}
      </div>
      <div className="flex justify-between gap-4 border-t border-primary/30 pt-4 text-lg font-bold">
        <dt>Total</dt>
        <dd className="text-highlight">
          <EthAmount value={summary.totalEth} />
        </dd>
      </div>
    </dl>
  );
}

export function PriceSummarySkeleton() {
  return (
    <div className="grid gap-4" aria-hidden="true">
      {[1, 2, 3].map((row) => (
        <div key={row} className="flex justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
      <Skeleton className="mt-2 h-7 w-full" />
    </div>
  );
}
