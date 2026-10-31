import { cn } from 'cn';
import { EthAmount } from '@/components/eth-amount';
import { NftImage } from '@/components/nft-image';
import type { QuoteLine } from '@/contracts/quote';

/** Rows share the parent's columns, so headings stay aligned while columns fit their content. */
const ROW = 'col-span-full grid grid-cols-subgrid items-center';

interface QuoteLinesProps {
  lines: readonly QuoteLine[];
  /** The receipt labels the quantity column ("Edições"); the checkout ruled header does not. */
  variant?: 'quote' | 'receipt';
}

/** Lines of a quote or receipt: what is being paid for, with quantity and line total. */
export function QuoteLines({ lines, variant = 'quote' }: QuoteLinesProps) {
  const receipt = variant === 'receipt';
  return (
    <div className="grid grid-cols-[70px_minmax(0,1fr)_auto_auto] gap-x-2 gap-y-3">
      <div
        aria-hidden="true"
        className={cn(
          ROW,
          'hidden text-base leading-4 font-bold sm:grid',
          !receipt && 'border-b border-primary/30 pb-3',
        )}
      >
        <span className="col-span-2">NFTs</span>
        <span className="text-right">{receipt && 'Edições'}</span>
        <span className="text-right font-medium">Subtotal</span>
      </div>
      <ul className={cn(ROW, 'gap-y-3')}>
        {lines.map((line) => (
          <li key={`${line.nftId}:${line.editionId}`} className={cn(ROW, 'bg-card pr-4 pl-1')}>
            <NftImage image={line.image} alt="" sizes="70px" className="size-[70px] rounded-lg" />
            <div className="grid min-w-0 gap-1.5 pl-1">
              <span className="truncate text-base leading-4 font-bold">{line.nftName}</span>
              <span className="truncate text-sm leading-4 text-subtle">
                ID do token: {line.tokenId}
              </span>
            </div>
            <span className="text-right text-sm text-muted-foreground">
              <span className="sr-only">Quantidade: </span>(x {line.quantity})
            </span>
            <span className="text-right text-lg leading-4 font-bold whitespace-nowrap text-highlight">
              <span className="sr-only">Subtotal: </span>
              <EthAmount value={line.lineTotalEth} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
