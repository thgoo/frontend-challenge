import { cn } from 'cn';
import type { ReactNode } from 'react';
import { EthAmount } from '@/components/eth-amount';
import { Skeleton } from '@/components/ui/skeleton';
import type { PriceSummary as Summary } from '@/contracts/pricing';
import { NETWORK_LABELS } from '@/lib/networks';

interface RowProps {
  label: ReactNode;
  children: ReactNode;
  /** The Figma sets the discount amount in the label size. */
  compact?: boolean;
}

function Row({ label, children, compact = false }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="leading-5">{label}</dt>
      <dd
        className={cn(
          'text-right whitespace-nowrap',
          compact ? 'text-[15px]' : 'text-base lg:text-lg',
        )}
      >
        {children}
      </dd>
    </div>
  );
}

interface PriceSummaryProps {
  summary: Summary;
  /** Before a quote the fee is only an estimate; quotes and receipts show the final fee. */
  estimatedFee?: boolean;
  /** The checkout draws a rule above the total; the cart does not. */
  separateTotal?: boolean;
}

export function PriceSummary({
  summary,
  estimatedFee = false,
  separateTotal = false,
}: PriceSummaryProps) {
  return (
    <dl className="grid gap-3 text-[15px]">
      <Row label="Subtotal">
        <EthAmount value={summary.subtotalEth} />
      </Row>
      <Row
        compact
        label={summary.coupon ? `Desconto (${summary.coupon.code})` : 'Desconto do lançamento'}
      >
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
      <div
        className={cn(
          'flex items-center justify-between gap-4 font-bold',
          separateTotal ? 'border-t border-primary/30 pt-3' : 'lg:mt-3',
        )}
      >
        <dt>Total</dt>
        <dd className="text-lg text-highlight">
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
