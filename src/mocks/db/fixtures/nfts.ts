import type { Edition, Nft } from '@/contracts/nft';
import { nftCategorySchema } from '@/contracts/nft';
import { networkSchema, type Network } from '@/contracts/wallet';
import { createRandom, pick, randomInt, type Random } from '../random';
import { createReviews, ratingOf } from './reviews';
import { ARTWORKS, artworkImage, type Artwork } from '@/lib/artwork';

export const NFT_FIXTURE_COUNT = 48;
const CATALOG_EPOCH = Date.parse('2026-09-01T12:00:00.000Z');
const DAY_MS = 86_400_000;
/** The Figma shows four thumbnails of the same piece in the detail gallery. */
const GALLERY_SIZE = 4;

const COLLECTION = 'Kurio Apes';
const ROYALTY_BASIS_POINTS = 500;
const CREATORS = [
  { id: 'creator_01', name: 'Nova Sato' },
  { id: 'creator_02', name: 'Mr Fox' },
  { id: 'creator_03', name: 'Shroomie' },
  { id: 'creator_04', name: 'Keepitreal' },
] as const;

const FAMILIES: Record<Artwork, { names: readonly string[]; traits: readonly string[] }> = {
  emerald: {
    names: ['Emerald Ape', 'Jade Captain', 'Varsity King'],
    traits: ['Óculos', 'Esmeralda', 'Jaqueta'],
  },
  sage: {
    names: ['Sage Nomad', 'Cosmic Bloom', 'Violet Nomad'],
    traits: ['Chapéu', 'Moletom', 'Lavanda'],
  },
  baron: {
    names: ['Neon Vessel', 'Ivory Baron', 'Onyx Envoy'],
    traits: ['Brinco', 'Gola alta', 'Ônix'],
  },
  golden: {
    names: ['Golden Beat', 'Golden Frequency', 'Golden Signal'],
    traits: ['Fones', 'Âmbar', 'Ritmo'],
  },
};

/** Cheapest first; prices scale from the open edition. */
const EDITION_TIERS = [
  { name: 'Aberta', priceFactor: 1, supply: [100, 500] },
  { name: '1/50', priceFactor: 1.5, supply: [50, 50] },
  { name: '1/10', priceFactor: 3, supply: [10, 10] },
  { name: '1/1', priceFactor: 10, supply: [1, 1] },
] as const;

const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  arbitrum: 'Arbitrum',
  base: 'Base',
};

/** The pieces drawn in the Figma, so the first catalog page mirrors the design. */
const SHOWCASE = [
  {
    name: 'Emerald Ape',
    token: 42,
    artwork: 'emerald',
    price: 1190,
    compareAt: null,
    trending: false,
    rare: true,
  },
  {
    name: 'Sage Nomad',
    token: 9,
    artwork: 'sage',
    price: 1690,
    compareAt: null,
    trending: true,
    rare: false,
  },
  {
    name: 'Neon Vessel',
    token: 552,
    artwork: 'baron',
    price: 1990,
    compareAt: 2290,
    trending: true,
    rare: true,
  },
  {
    name: 'Cosmic Bloom',
    token: 118,
    artwork: 'sage',
    price: 1290,
    compareAt: null,
    trending: false,
    rare: false,
  },
  {
    name: 'Violet Nomad',
    token: 314,
    artwork: 'sage',
    price: 1390,
    compareAt: null,
    trending: false,
    rare: false,
  },
  {
    name: 'Ivory Baron',
    token: 88,
    artwork: 'baron',
    price: 1790,
    compareAt: null,
    trending: true,
    rare: false,
  },
  {
    name: 'Golden Beat',
    token: 207,
    artwork: 'golden',
    price: 990,
    compareAt: null,
    trending: false,
    rare: false,
  },
  {
    name: 'Golden Frequency',
    token: 71,
    artwork: 'golden',
    price: 590,
    compareAt: null,
    trending: true,
    rare: false,
  },
  {
    name: 'Golden Signal',
    token: 160,
    artwork: 'golden',
    price: 390,
    compareAt: null,
    trending: false,
    rare: false,
  },
] as const satisfies readonly {
  name: string;
  token: number;
  artwork: Artwork;
  price: number;
  compareAt: number | null;
  trending: boolean;
  rare: boolean;
}[];

function toEth(thousandths: number): string {
  return (thousandths / 1000).toFixed(3).replace(/\.?0+$/, '');
}

interface Listing {
  name: string;
  token: number;
  artwork: Artwork;
  /** Open edition price in thousandths of ETH. */
  price: number;
  compareAt: number | null;
  trending: boolean;
  rare: boolean;
  tiers: number;
  soldOutRate: number;
}

function createEditions(random: Random, number: number, listing: Listing): Edition[] {
  return EDITION_TIERS.slice(0, listing.tiers).map((tier, tierIndex) => {
    const supply = randomInt(random, tier.supply[0], tier.supply[1]);
    const soldOut = random() < listing.soldOutRate;
    const isCheapest = tierIndex === 0;
    return {
      id: `ed_${String(number).padStart(3, '0')}_${String(tierIndex + 1)}`,
      name: tier.name,
      priceEth: toEth(Math.round(listing.price * tier.priceFactor)),
      supply,
      available: soldOut ? 0 : randomInt(random, 1, supply),
      maxPerOrder: Math.min(supply, 5),
      compareAtPriceEth: isCheapest && listing.compareAt ? toEth(listing.compareAt) : null,
    };
  });
}

function generatedListing(random: Random): Listing {
  const artwork = pick(random, ARTWORKS);
  const price = randomInt(random, 300, 2000);
  return {
    name: pick(random, FAMILIES[artwork].names),
    token: randomInt(random, 1, 999),
    artwork,
    price,
    compareAt: random() < 0.1 ? Math.round(price * 1.15) : null,
    trending: random() < 0.25,
    rare: random() < 0.15,
    tiers: randomInt(random, 1, EDITION_TIERS.length),
    soldOutRate: 0.12,
  };
}

export function createNftFixtures(seed: number): Nft[] {
  const random = createRandom(seed);
  const categories = nftCategorySchema.options;
  const networks = networkSchema.options;

  return Array.from({ length: NFT_FIXTURE_COUNT }, (_, index) => {
    const number = index + 1;
    const showcase = SHOWCASE[index];
    const listing: Listing = showcase
      ? { ...showcase, tiers: EDITION_TIERS.length, soldOutRate: 0 }
      : generatedListing(random);
    const tokenId = String(listing.token).padStart(3, '0');
    const name = `${listing.name} #${tokenId}`;
    const network = networks[index % networks.length] ?? 'ethereum';
    const creator = pick(random, CREATORS);

    const id = `nft_${String(number).padStart(3, '0')}`;
    const contractAddress = `0x${Array.from({ length: 40 }, () => randomInt(random, 0, 15).toString(16)).join('')}`;

    return {
      id,
      name,
      description: `Um colecionável digital finalizado à mão da coleção ${COLLECTION}, verificado na ${NETWORK_LABELS[network]}, com arte desbloqueável e acesso para colecionadores.`,
      category: categories[index % categories.length] ?? 'digital-art',
      network,
      collection: COLLECTION,
      tokenId: `#${tokenId.padStart(4, '0')}`,
      contractAddress,
      royaltyBasisPoints: ROYALTY_BASIS_POINTS,
      rating: ratingOf(createReviews(id)),
      tags: [...FAMILIES[listing.artwork].traits],
      images: [
        artworkImage(listing.artwork, `${name}, vista 1`),
        ...Array.from({ length: GALLERY_SIZE - 1 }, (_, view) =>
          artworkImage(listing.artwork, `${name}, vista ${String(view + 2)}`),
        ),
      ],
      creator,
      editions: createEditions(random, number, listing),
      featured: number <= 3,
      trending: listing.trending,
      rare: listing.rare,
      createdAt: new Date(CATALOG_EPOCH - index * DAY_MS).toISOString(),
      version: 1,
    };
  });
}
