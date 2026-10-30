import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Slider } from 'radix-ui';
import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { nftCategorySchema, type NftFacets, type NftListQuery } from '@/contracts/nft';
import { networkSchema } from '@/contracts/wallet';
import { displayEthNumber, formatEth, parseEth } from '@/lib/eth';
import { NETWORK_LABELS } from '@/lib/networks';
import { CATEGORY_LABELS } from '../category-labels';
import { nftFacetsQueryOptions } from '../queries';

export type FilterPatch = Partial<Omit<NftListQuery, 'page'>>;

interface FiltersProps {
  query: NftListQuery;
  onChange: (patch: FilterPatch) => void;
}

const SEARCH_DEBOUNCE_MS = 300;
/** The slider moves in 0.01 ETH steps. */
const WEI_PER_STEP = 10n ** 16n;

const toSteps = (eth: string) => Number(parseEth(eth) / WEI_PER_STEP);
const ceilSteps = (eth: string) => Number((parseEth(eth) + WEI_PER_STEP - 1n) / WEI_PER_STEP);
const fromSteps = (steps: number) => formatEth(BigInt(steps) * WEI_PER_STEP);
const stepsLabel = (steps: number) => displayEthNumber(fromSteps(steps), 2);

function toggled<T>(options: readonly T[], selected: readonly T[] | undefined, value: T) {
  const next = new Set(selected);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  const ordered = options.filter((option) => next.has(option));
  return ordered.length > 0 ? ordered : undefined;
}

function FacetOption(props: {
  label: string;
  count: number | undefined;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={props.selected}
        onClick={props.onToggle}
        className="flex w-full items-center justify-between rounded py-2.5 text-[15px] leading-5 text-muted-foreground hover:text-highlight aria-pressed:text-highlight"
      >
        <span>{props.label}</span>
        <span className="font-bold">({props.count ?? '–'})</span>
      </button>
    </li>
  );
}

function PriceRange({
  query,
  onChange,
  range,
}: FiltersProps & { range: NftFacets['priceRange'] | undefined }) {
  const bounds = range ? ([toSteps(range.min), ceilSteps(range.max)] as const) : ([0, 0] as const);
  const selected: [number, number] = [
    query.minPrice ? toSteps(query.minPrice) : bounds[0],
    query.maxPrice ? ceilSteps(query.maxPrice) : bounds[1],
  ];
  const [draft, setDraft] = useState(selected);
  const selectedKey = selected.join('-');
  const [syncedKey, setSyncedKey] = useState(selectedKey);
  if (selectedKey !== syncedKey) {
    setSyncedKey(selectedKey);
    setDraft(selected);
  }

  const apply = () => {
    const [low, high] = draft;
    onChange({
      minPrice: low > bounds[0] ? fromSteps(low) : undefined,
      maxPrice: high < bounds[1] ? fromSteps(high) : undefined,
    });
  };
  const thumbs = [
    { label: 'Preço mínimo', value: draft[0] },
    { label: 'Preço máximo', value: draft[1] },
  ];

  return (
    <fieldset className="grid gap-3" disabled={!range}>
      <legend className="mb-3 text-lg leading-4 font-bold">Faixa de preço</legend>
      <div className="grid gap-3 pl-3">
        <Slider.Root
          min={bounds[0]}
          max={bounds[1]}
          step={1}
          minStepsBetweenThumbs={1}
          value={draft}
          onValueChange={(value) => {
            const [low = bounds[0], high = bounds[1]] = value;
            setDraft([low, high]);
          }}
          className="relative flex h-5 touch-none items-center select-none"
        >
          <Slider.Track className="relative h-1 grow bg-primary/30">
            <Slider.Range className="absolute h-full bg-primary" />
          </Slider.Track>
          {thumbs.map((thumb) => (
            <Slider.Thumb
              key={thumb.label}
              aria-label={thumb.label}
              aria-valuetext={`${stepsLabel(thumb.value)} ETH`}
              className="block size-[15px] rounded-full border-[3px] border-background bg-primary ring-ring focus-visible:ring-2 focus-visible:outline-none"
            />
          ))}
        </Slider.Root>
        <p className="text-[15px]" aria-live="polite">
          Preço: {stepsLabel(draft[0])} - {stepsLabel(draft[1])} ETH
        </p>
        <Button onClick={apply} className="h-9 justify-self-start px-3 text-base font-bold">
          Aplicar
        </Button>
      </div>
    </fieldset>
  );
}

function FilterControls({ query, onChange }: FiltersProps) {
  const { data: facets } = useQuery(nftFacetsQueryOptions);
  const availableId = useId();
  const hasFilters = Boolean(
    query.categories?.length ||
    query.networks?.length ||
    query.minPrice ||
    query.maxPrice ||
    query.onlyAvailable,
  );

  return (
    <div className="grid gap-10">
      <fieldset className="grid gap-3">
        <legend className="mb-3 text-lg leading-4 font-bold">Coleções</legend>
        <ul className="px-3">
          {nftCategorySchema.options.map((category) => (
            <FacetOption
              key={category}
              label={CATEGORY_LABELS[category]}
              count={facets?.categories[category]}
              selected={query.categories?.includes(category) ?? false}
              onToggle={() => {
                onChange({
                  categories: toggled(nftCategorySchema.options, query.categories, category),
                });
              }}
            />
          ))}
        </ul>
      </fieldset>
      <PriceRange query={query} onChange={onChange} range={facets?.priceRange} />
      <fieldset className="grid gap-3">
        <legend className="mb-3 text-lg leading-4 font-bold">Rede</legend>
        <ul className="pl-3">
          {networkSchema.options.map((network) => (
            <FacetOption
              key={network}
              label={NETWORK_LABELS[network]}
              count={facets?.networks[network]}
              selected={query.networks?.includes(network) ?? false}
              onToggle={() => {
                onChange({ networks: toggled(networkSchema.options, query.networks, network) });
              }}
            />
          ))}
        </ul>
      </fieldset>
      <div className="flex items-center gap-2">
        <Checkbox
          id={availableId}
          checked={query.onlyAvailable ?? false}
          onCheckedChange={(checked) => {
            onChange({ onlyAvailable: checked === true || undefined });
          }}
        />
        <Label htmlFor={availableId}>Somente disponíveis</Label>
      </div>
      {hasFilters && (
        <Button
          variant="outline"
          onClick={() => {
            onChange({
              categories: undefined,
              networks: undefined,
              minPrice: undefined,
              maxPrice: undefined,
              onlyAvailable: undefined,
            });
          }}
        >
          Limpar filtros
        </Button>
      )}
    </div>
  );
}

export function FiltersPanel(props: FiltersProps) {
  return (
    <section aria-label="Filtros" className="bg-card p-5">
      <FilterControls {...props} />
    </section>
  );
}

function SearchBox({ query, onChange }: FiltersProps) {
  const id = useId();
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
    <div role="search" className="relative flex-1">
      <label htmlFor={id} className="sr-only">
        Buscar NFTs
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-subtle"
      />
      <input
        id={id}
        type="search"
        placeholder="Explorar coleções"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
        }}
        className="h-[45px] w-full rounded-[10px] bg-card pr-3 pl-11 text-sm font-bold placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      />
    </div>
  );
}

/** Mobile search bar with the filters drawer, as in the Figma. */
export function MobileCatalogBar(props: FiltersProps) {
  const { query } = props;
  const activeCount =
    (query.categories?.length ?? 0) +
    (query.networks?.length ?? 0) +
    Number(Boolean(query.minPrice || query.maxPrice)) +
    Number(Boolean(query.onlyAvailable));

  return (
    <div className="flex gap-2 lg:hidden">
      <SearchBox {...props} />
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label={activeCount > 0 ? `Filtros (${String(activeCount)} ativos)` : 'Filtros'}
            className="relative grid size-[45px] place-items-center rounded-[14px] bg-linear-to-b from-primary/45 to-primary text-foreground"
          >
            <SlidersHorizontal aria-hidden="true" className="size-5" />
            {activeCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background"
              >
                {activeCount}
              </span>
            )}
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <FilterControls {...props} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
