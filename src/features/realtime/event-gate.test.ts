import { describe, expect, it } from 'vitest';
import { createEventGate } from './event-gate';

const event = (eventId: string, version: number, id = 'nft_001') => ({
  eventId,
  resource: { type: 'nft', id },
  version,
});

describe('createEventGate', () => {
  it('accepts newer versions in order', () => {
    const gate = createEventGate();
    expect([gate.accept(event('a', 2)), gate.accept(event('b', 3))]).toEqual([true, true]);
  });

  it('drops duplicates by event id', () => {
    const gate = createEventGate();
    gate.accept(event('a', 2));
    expect(gate.accept(event('a', 2))).toBe(false);
  });

  it('drops stale versions that arrive late', () => {
    const gate = createEventGate();
    gate.accept(event('b', 3));
    expect(gate.accept(event('a', 2))).toBe(false);
  });

  it('tracks versions per resource', () => {
    const gate = createEventGate();
    gate.accept(event('a', 5, 'nft_001'));
    expect(gate.accept(event('b', 2, 'nft_002'))).toBe(true);
  });
});
