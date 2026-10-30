import { describe, expect, it } from 'vitest';
import { applyBasisPoints, displayEth, formatEth, parseEth, sumEth } from './eth';

describe('parseEth / formatEth', () => {
  it.each([
    ['0', 0n],
    ['1', 10n ** 18n],
    ['0.1', 10n ** 17n],
    ['1.000000000000000001', 10n ** 18n + 1n],
    ['123.45', 123_450_000_000_000_000_000n],
  ])('round-trips %s', (eth, wei) => {
    expect(parseEth(eth)).toBe(wei);
    expect(formatEth(wei)).toBe(eth);
  });

  it.each(['', '-1', '1.', '.5', '1e3', '0.0000000000000000001', 'abc'])('rejects %j', (value) => {
    expect(() => parseEth(value)).toThrow(RangeError);
  });

  it('avoids floating point drift', () => {
    expect(formatEth(parseEth('0.1') + parseEth('0.2'))).toBe('0.3');
  });
});

describe('arithmetic', () => {
  it('sums wei values', () => {
    expect(
      formatEth(sumEth([parseEth('1.5'), parseEth('0.25'), parseEth('0.000000000000000001')])),
    ).toBe('1.750000000000000001');
  });

  it('multiplies by integer quantities', () => {
    expect(formatEth(parseEth('0.333') * 3n)).toBe('0.999');
  });

  it('applies basis points rounding down', () => {
    expect(formatEth(applyBasisPoints(parseEth('2.5'), 1000))).toBe('0.25');
    expect(applyBasisPoints(1n, 5000)).toBe(0n);
  });
});

describe('displayEth', () => {
  it('truncates without rounding up', () => {
    expect(displayEth('1.99999', 4)).toBe('1,9999 ETH');
    expect(displayEth('1.99999')).toBe('1,99999 ETH');
  });

  it('pads to the minimum fraction digits and groups thousands in pt-BR', () => {
    expect(displayEth('1234')).toBe('1.234,00 ETH');
  });
});
