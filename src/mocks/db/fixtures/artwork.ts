import { createRandom, pick, randomInt } from '../random';

const PALETTES = [
  ['#A259FF', '#377DF7'],
  ['#FF6250', '#FFB86B'],
  ['#00AC4F', '#C7F464'],
  ['#2B2B2B', '#A259FF'],
  ['#14C8B0', '#3B3B98'],
  ['#F72585', '#7209B7'],
] as const;

/** Deterministic SVG placeholder until the Figma assets are exported. */
export function artworkDataUrl(seed: number): string {
  const random = createRandom(seed);
  const [from, to] = pick(random, PALETTES);
  const cx = randomInt(random, 80, 320);
  const cy = randomInt(random, 80, 320);
  const r = randomInt(random, 60, 160);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" fill-opacity=".18"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
