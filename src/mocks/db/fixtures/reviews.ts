import type { Review } from '@/contracts/nft';
import { createRandom, pick, randomInt } from '../random';

const AUTHORS = ['Ana Ribeiro', 'Bruno Costa', 'Carla Mendes', 'Diego Souza', 'Elisa Prado'];
const COMMENTS = [
  'Arte impecável, os detalhes ficam ainda melhores em alta resolução.',
  'Transferência rápida e procedência clara. Recomendo.',
  'Peça favorita da minha coleção até agora.',
  'Ótimo custo-benefício para uma edição limitada.',
  'Atendimento do criador foi excelente na revelação.',
];
const REVIEW_EPOCH = Date.parse('2026-09-15T12:00:00.000Z');
const HOUR_MS = 3_600_000;

/** FNV-1a over the ASCII id. */
function seedOf(nftId: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < nftId.length; index += 1) {
    hash = Math.imul(hash ^ nftId.charCodeAt(index), 16_777_619);
  }
  return hash;
}

/** Derived from the NFT id, so the list and the advertised rating always agree without storage. */
export function createReviews(nftId: string): Review[] {
  const random = createRandom(seedOf(nftId));
  return Array.from({ length: randomInt(random, 4, 24) }, (_, index) => ({
    id: `rev_${nftId}_${String(index + 1)}`,
    author: pick(random, AUTHORS),
    rating: random() < 0.8 ? 5 : 4,
    comment: pick(random, COMMENTS),
    createdAt: new Date(REVIEW_EPOCH - index * 37 * HOUR_MS).toISOString(),
  }));
}

export function ratingOf(reviews: readonly Review[]) {
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    average: reviews.length === 0 ? 0 : Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}
