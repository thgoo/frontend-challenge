import type { Edition, Nft, NftCategory } from '@/contracts/nft';
import { nftCategorySchema } from '@/contracts/nft';
import { createRandom, pick, randomInt, type Random } from '../random';
import { artworkDataUrl } from './artwork';

export const NFT_FIXTURE_COUNT = 48;
const CATALOG_EPOCH = Date.parse('2026-09-01T12:00:00.000Z');
const DAY_MS = 86_400_000;

const ADJECTIVES = ['Distant', 'Neon', 'Silent', 'Golden', 'Liquid', 'Fractal', 'Lunar', 'Velvet'];
const NOUNS = ['Galaxy', 'Garden', 'Machine', 'Dream', 'Horizon', 'Echo', 'Bloom', 'Signal'];
const TAGS = ['abstract', 'generative', '3d', 'pixel', 'retro', 'surreal', 'minimal', 'cyber'];
const CREATORS = [
  { id: 'creator_01', name: 'Orbitian' },
  { id: 'creator_02', name: 'Mr Fox' },
  { id: 'creator_03', name: 'Shroomie' },
  { id: 'creator_04', name: 'Keepitreal' },
  { id: 'creator_05', name: 'Robotica' },
  { id: 'creator_06', name: 'NebulaKid' },
] as const;
const EDITION_TIERS = [
  { name: 'Standard', priceFactor: 1, supply: [20, 100] },
  { name: 'Gold', priceFactor: 3, supply: [5, 15] },
  { name: 'One of One', priceFactor: 10, supply: [1, 1] },
] as const;

function priceEth(random: Random, factor: number): string {
  const thousandths = randomInt(random, 10, 1500) * factor;
  return (thousandths / 1000).toFixed(3).replace(/\.?0+$/, '');
}

function createEditions(random: Random, nftIndex: number): Edition[] {
  const tierCount = randomInt(random, 1, EDITION_TIERS.length);
  return EDITION_TIERS.slice(0, tierCount).map((tier, tierIndex) => {
    const supply = randomInt(random, tier.supply[0], tier.supply[1]);
    const soldOut = random() < 0.12;
    return {
      id: `ed_${String(nftIndex).padStart(3, '0')}_${tierIndex + 1}`,
      name: tier.name,
      priceEth: priceEth(random, tier.priceFactor),
      supply,
      available: soldOut ? 0 : randomInt(random, 1, supply),
      maxPerOrder: Math.min(supply, 5),
    };
  });
}

export function createNftFixtures(seed: number): Nft[] {
  const random = createRandom(seed);
  const categories: readonly NftCategory[] = nftCategorySchema.options;

  return Array.from({ length: NFT_FIXTURE_COUNT }, (_, index) => {
    const number = index + 1;
    const name = `${pick(random, ADJECTIVES)} ${pick(random, NOUNS)} #${number}`;
    const creator = pick(random, CREATORS);
    const images = Array.from({ length: randomInt(random, 1, 3) }, (_, imageIndex) => ({
      url: artworkDataUrl(number * 10 + imageIndex),
      alt: `${name}, artwork view ${imageIndex + 1}`,
    }));

    return {
      id: `nft_${String(number).padStart(3, '0')}`,
      name,
      description: `${name} is a ${pick(random, TAGS)} piece by ${creator.name}.`,
      category: categories[index % categories.length] ?? 'art',
      tags: [pick(random, TAGS), pick(random, TAGS)].filter(
        (tag, i, all) => all.indexOf(tag) === i,
      ),
      images,
      creator: { ...creator, avatarUrl: artworkDataUrl(1000 + Number(creator.id.slice(-2))) },
      editions: createEditions(random, number),
      featured: number <= 3,
      createdAt: new Date(CATALOG_EPOCH - index * DAY_MS).toISOString(),
      version: 1,
    };
  });
}
