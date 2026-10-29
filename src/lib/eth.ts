const DECIMALS = 18;
const WEI_PER_ETH = 10n ** BigInt(DECIMALS);
const BASIS_POINTS = 10_000n;
const ETH_PATTERN = /^(\d+)(?:\.(\d{1,18}))?$/;

export function parseEth(value: string): bigint {
  const match = ETH_PATTERN.exec(value);
  if (!match) throw new RangeError(`Invalid ETH amount: "${value}"`);
  const [, whole = '0', fraction = ''] = match;
  return BigInt(whole) * WEI_PER_ETH + BigInt(fraction.padEnd(DECIMALS, '0'));
}

export function formatEth(wei: bigint): string {
  if (wei < 0n) throw new RangeError('Negative ETH amounts are not supported');
  const whole = wei / WEI_PER_ETH;
  const fraction = (wei % WEI_PER_ETH).toString().padStart(DECIMALS, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function sumEth(values: readonly bigint[]): bigint {
  return values.reduce((total, value) => total + value, 0n);
}

/** Rounds down, so a discount never exceeds the exact percentage. */
export function applyBasisPoints(wei: bigint, basisPoints: number): bigint {
  return (wei * BigInt(basisPoints)) / BASIS_POINTS;
}

/** Exact by default; a smaller `maxFractionDigits` truncates instead of rounding, never overstating. */
export function displayEth(value: string, maxFractionDigits = 18, minFractionDigits = 2): string {
  const [whole = '0', fraction = ''] = formatEth(parseEth(value)).split('.');
  const truncated = fraction.slice(0, maxFractionDigits).padEnd(minFractionDigits, '0');
  const groupedWhole = BigInt(whole).toLocaleString('en-US');
  return `${groupedWhole}.${truncated} ETH`;
}
