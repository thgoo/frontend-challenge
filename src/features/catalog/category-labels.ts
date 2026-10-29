import type { NftCategory, NftSort } from '@/contracts/nft';

export const CATEGORY_LABELS: Record<NftCategory, string> = {
  art: 'Art',
  collectibles: 'Collectibles',
  music: 'Music',
  photography: 'Photography',
  video: 'Video',
  utility: 'Utility',
  sport: 'Sport',
  'virtual-worlds': 'Virtual Worlds',
};

export const SORT_LABELS: Record<NftSort, string> = {
  newest: 'Newest',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  'name-asc': 'Name: A to Z',
};
