import { displayEth } from '@/lib/eth';

export function EthAmount({ value, className }: { value: string; className?: string }) {
  return (
    <span className={className} data-eth={value}>
      {displayEth(value)}
    </span>
  );
}
