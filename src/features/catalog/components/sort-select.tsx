import { cn } from 'cn';
import { useId } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { nftSortSchema, type NftSort } from '@/contracts/nft';
import { SORT_LABELS } from '../category-labels';
import type { FilterPatch } from './catalog-filters';

interface SortSelectProps {
  value: NftSort;
  onChange: (patch: FilterPatch) => void;
  className?: string;
}

export function SortSelect({ value, onChange, className }: SortSelectProps) {
  const id = useId();
  return (
    <div className={cn('flex items-center gap-1 text-[15px]', className)}>
      <label htmlFor={id}>Ordenar por:</label>
      <Select
        value={value}
        onValueChange={(sort) => {
          onChange({ sort: nftSortSchema.parse(sort) });
        }}
      >
        <SelectTrigger
          id={id}
          className="border-none bg-transparent px-1 py-0 text-[15px] shadow-none data-[size=default]:h-auto"
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
  );
}
