import { describe, expect, it } from 'vitest';
import { BUILDINGS, totalStarBudget, ZONES } from './catalog';

describe('island catalog', () => {
  it('has 20 buildings and 70-star budget', () => {
    expect(BUILDINGS).toHaveLength(20);
    expect(totalStarBudget()).toBe(70);
  });

  it('has 7 zones', () => {
    expect(ZONES).toHaveLength(7);
  });

  it('places every building in a known zone', () => {
    const ids = new Set(ZONES.map((z) => z.id));
    for (const b of BUILDINGS) {
      expect(ids.has(b.zone)).toBe(true);
    }
  });
});
