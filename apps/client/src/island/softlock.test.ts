import { describe, expect, it } from 'vitest';
import { BUILDINGS, totalStarBudget } from './catalog';
import { simulateIslandRoute } from './softlock';

describe('island soft-lock route 1–70', () => {
  it('completes all mandatory stages with greedy spend and zero leftover stars', () => {
    expect(totalStarBudget()).toBe(70);
    const result = simulateIslandRoute();
    expect(result.failures, result.failures.join('; ')).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.finalStars).toBe(0);
    for (const b of BUILDINGS) {
      expect(result.finalStages[b.id]).toBe(b.stages.length);
    }
  });

  it('records spends around story milestones', () => {
    const result = simulateIslandRoute();
    const milestones = [10, 20, 30, 40, 50, 60, 70];
    for (const m of milestones) {
      const step = result.steps[m - 1];
      expect(step, `missing step ${m}`).toBeTruthy();
      expect(step!.level).toBe(m);
    }
    // By level 10 at least B01–B03 chain should have started.
    const after10 = result.steps[9]!;
    const spentIds = new Set(
      result.steps
        .slice(0, 10)
        .flatMap((s) => s.spent.map((x) => x.buildingId)),
    );
    expect(spentIds.has('B01')).toBe(true);
    expect(after10.starsAfterSpend).toBeGreaterThanOrEqual(0);
  });
});
