import { EthAmount } from '@/components/eth-amount';
import { NftImage } from '@/components/nft-image';
import type { QuoteLine } from '@/contracts/quote';

/** Lines of a quote or receipt: what is being paid for, with quantity and line total. */
export function QuoteLines({ lines }: { lines: readonly QuoteLine[] }) {
  return (
    <ul className="grid gap-3">
      {lines.map((line) => (
        <li
          key={`${line.nftId}:${line.editionId}`}
          className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 bg-card p-1 pr-4"
        >
          <NftImage image={line.image} alt="" sizes="56px" className="size-14 rounded-lg" />
          <div className="grid min-w-0">
            <span className="truncate text-[15px] font-bold">{line.nftName}</span>
            <span className="truncate text-sm text-muted-foreground">
              ID do token: {line.tokenId} · {line.editionName}
            </span>
          </div>
          <div className="flex items-baseline gap-3 whitespace-nowrap">
            <span className="text-sm text-muted-foreground">
              <span className="sr-only">Quantidade: </span>(x {line.quantity})
            </span>
            <span className="text-lg font-bold text-highlight">
              <span className="sr-only">Subtotal: </span>
              <EthAmount value={line.lineTotalEth} />
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
