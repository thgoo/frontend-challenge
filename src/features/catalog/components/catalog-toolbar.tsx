import { cn } from 'cn';
import { nftViewSchema, type NftListQuery } from '@/contracts/nft';
import { VIEW_LABELS } from '../category-labels';
import type { FilterPatch } from './catalog-filters';
import { SortSelect } from './sort-select';

interface ToolbarProps {
  query: NftListQuery;
  onChange: (patch: FilterPatch) => void;
}

export function CatalogToolbar({ query, onChange }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
      <div
        role="group"
        aria-label="Visualização"
        className="flex flex-wrap gap-x-4 gap-y-2 lg:gap-5"
      >
        {nftViewSchema.options.map((view) => (
          <button
            key={view}
            type="button"
            aria-pressed={query.view === view}
            onClick={() => {
              onChange({ view });
            }}
            className={cn(
              // On desktop the Figma underline stops short of the label's end.
              'relative pb-1 text-sm leading-4 whitespace-nowrap lg:pb-1.5 lg:text-[15px] lg:font-medium',
              query.view === view
                ? 'font-bold text-highlight after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:bg-primary lg:after:right-4'
                : 'hover:text-highlight',
            )}
          >
            {VIEW_LABELS[view]}
          </button>
        ))}
      </div>
      {/* On mobile the Figma has no sort row: sorting lives in the filters drawer. */}
      <SortSelect value={query.sort} onChange={onChange} className="max-lg:hidden" />
    </div>
  );
}
