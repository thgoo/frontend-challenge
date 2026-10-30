import { cn } from 'cn';
import { useId } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { nftSortSchema, nftViewSchema, type NftListQuery } from '@/contracts/nft';
import { SORT_LABELS, VIEW_LABELS } from '../category-labels';
import type { FilterPatch } from './catalog-filters';

interface ToolbarProps {
  query: NftListQuery;
  onChange: (patch: FilterPatch) => void;
}

export function CatalogToolbar({ query, onChange }: ToolbarProps) {
  const sortId = useId();
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
      <div role="group" aria-label="Visualização" className="flex gap-4 lg:gap-5">
        {nftViewSchema.options.map((view) => (
          <button
            key={view}
            type="button"
            aria-pressed={query.view === view}
            onClick={() => {
              onChange({ view });
            }}
            className={cn(
              'border-b-2 pb-1 text-sm whitespace-nowrap lg:text-[15px] lg:font-medium',
              query.view === view
                ? 'border-primary font-bold text-highlight'
                : 'border-transparent hover:text-highlight',
            )}
          >
            {VIEW_LABELS[view]}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 text-[15px]">
        <label htmlFor={sortId}>Ordenar por:</label>
        <Select
          value={query.sort}
          onValueChange={(sort) => {
            onChange({ sort: nftSortSchema.parse(sort) });
          }}
        >
          <SelectTrigger
            id={sortId}
            className="h-auto border-none bg-transparent px-1 py-0 text-[15px] shadow-none"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {nftSortSchema.options.map((sort) => (
              <SelectItem key={sort} value={sort}>
                {SORT_LABELS[sort]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
