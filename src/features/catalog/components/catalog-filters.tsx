import { SlidersHorizontal } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { FormField } from '@/components/form-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ethAmountSchema } from '@/contracts/common';
import { FIELD_ERRORS } from '@/contracts/field-errors';
import { normalizeDecimalInput } from '@/i18n/locale';
import { nftCategorySchema, nftSortSchema, type NftListQuery } from '@/contracts/nft';
import { CATEGORY_LABELS, SORT_LABELS } from '../category-labels';

type FilterPatch = Partial<Omit<NftListQuery, 'page'>>;

interface FiltersProps {
  query: NftListQuery;
  onChange: (patch: FilterPatch) => void;
}

const SEARCH_DEBOUNCE_MS = 300;

export function SearchBox({ query, onChange }: FiltersProps) {
  const [value, setValue] = useState(query.q ?? '');
  const [syncedQuery, setSyncedQuery] = useState(query.q);
  if (query.q !== syncedQuery) {
    setSyncedQuery(query.q);
    setValue(query.q ?? '');
  }

  useEffect(() => {
    if (value === (query.q ?? '')) return;
    const timer = setTimeout(() => {
      onChange({ q: value || undefined });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [value, query.q, onChange]);

  return (
    <div role="search" className="flex-1">
      <FormField
        label="Search NFTs"
        type="search"
        placeholder="Search by name, creator or tag"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
        }}
      />
    </div>
  );
}

export function SortSelect({ query, onChange }: FiltersProps) {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Sort by</Label>
      <Select
        value={query.sort}
        onValueChange={(sort) => {
          onChange({ sort: nftSortSchema.parse(sort) });
        }}
      >
        <SelectTrigger id={id} className="w-full sm:w-52">
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

function PriceField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value?: string;
  onCommit: (value?: string) => void;
}) {
  const [draft, setDraft] = useState(value ?? '');
  const [error, setError] = useState<string>();
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(value ?? '');
  }

  const commit = () => {
    if (draft === '') {
      setError(undefined);
      onCommit(undefined);
      return;
    }
    const parsed = ethAmountSchema.safeParse(normalizeDecimalInput(draft));
    setError(parsed.success ? undefined : FIELD_ERRORS.amountInvalid);
    if (parsed.success) onCommit(parsed.data);
  };

  return (
    <FormField
      label={label}
      inputMode="decimal"
      placeholder="0.00"
      value={draft}
      error={error}
      onChange={(event) => {
        setDraft(event.target.value.trim());
      }}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commit();
      }}
    />
  );
}

function FilterControls({ query, onChange }: FiltersProps) {
  const idPrefix = useId();
  const selected = new Set(query.categories);
  const toggleCategory = (
    category: (typeof nftCategorySchema.options)[number],
    checked: boolean,
  ) => {
    const next = nftCategorySchema.options.filter((option) =>
      option === category ? checked : selected.has(option),
    );
    onChange({ categories: next.length > 0 ? next : undefined });
  };
  const hasFilters = Boolean(
    query.categories?.length || query.minPrice || query.maxPrice || query.onlyAvailable,
  );

  return (
    <div className="grid gap-6">
      <fieldset className="grid gap-3">
        <legend className="mb-2 font-semibold">Categories</legend>
        {nftCategorySchema.options.map((category) => (
          <div key={category} className="flex items-center gap-2">
            <Checkbox
              id={`${idPrefix}-${category}`}
              checked={selected.has(category)}
              onCheckedChange={(checked) => {
                toggleCategory(category, checked === true);
              }}
            />
            <Label htmlFor={`${idPrefix}-${category}`}>{CATEGORY_LABELS[category]}</Label>
          </div>
        ))}
      </fieldset>
      <fieldset className="grid gap-3">
        <legend className="mb-2 font-semibold">Price (ETH)</legend>
        <PriceField
          label="Minimum"
          value={query.minPrice}
          onCommit={(minPrice) => {
            onChange({ minPrice });
          }}
        />
        <PriceField
          label="Maximum"
          value={query.maxPrice}
          onCommit={(maxPrice) => {
            onChange({ maxPrice });
          }}
        />
      </fieldset>
      <div className="flex items-center gap-2">
        <Checkbox
          id={`${idPrefix}-available`}
          checked={query.onlyAvailable ?? false}
          onCheckedChange={(checked) => {
            onChange({ onlyAvailable: checked === true || undefined });
          }}
        />
        <Label htmlFor={`${idPrefix}-available`}>Only available</Label>
      </div>
      {hasFilters && (
        <Button
          variant="outline"
          onClick={() => {
            onChange({
              categories: undefined,
              minPrice: undefined,
              maxPrice: undefined,
              onlyAvailable: undefined,
            });
          }}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}

export function FiltersSidebar(props: FiltersProps) {
  return (
    <aside aria-label="Filters" className="hidden lg:block">
      <FilterControls {...props} />
    </aside>
  );
}

export function FiltersDrawer(props: FiltersProps) {
  const activeCount =
    (props.query.categories?.length ?? 0) +
    Number(Boolean(props.query.minPrice)) +
    Number(Boolean(props.query.maxPrice)) +
    Number(Boolean(props.query.onlyAvailable));

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="self-end lg:hidden">
          <SlidersHorizontal aria-hidden="true" />
          Filters{activeCount > 0 && ` (${activeCount})`}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6">
          <FilterControls {...props} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
