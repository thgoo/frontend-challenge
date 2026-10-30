import type { NftImage } from '@/contracts/nft';

/** Illustrations exported from the Figma into `public/nfts`, shared by the mocks and static sections. */
export const ARTWORKS = ['emerald', 'sage', 'baron', 'golden'] as const;
export type Artwork = (typeof ARTWORKS)[number];

const WIDTHS = [400, 800] as const;

export function artworkImage(artwork: Artwork, alt = ''): NftImage {
  return {
    url: `/nfts/${artwork}-800.webp`,
    alt,
    variants: WIDTHS.flatMap((width) => [
      { url: `/nfts/${artwork}-${String(width)}.avif`, width, type: 'image/avif' as const },
      { url: `/nfts/${artwork}-${String(width)}.webp`, width, type: 'image/webp' as const },
    ]),
  };
}
