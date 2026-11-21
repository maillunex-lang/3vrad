import { describe, expect, it } from 'vitest';
import { STORY_MILESTONES, beatForLevel, STYLE_UNLOCK } from './milestones';

describe('story milestones', () => {
  it('covers 10/20/30/40/50/60/70', () => {
    expect(STORY_MILESTONES.map((b) => b.level)).toEqual([10, 20, 30, 40, 50, 60, 70]);
    for (const b of STORY_MILESTONES) {
      expect(b.title.length).toBeGreaterThan(3);
      expect(b.lines.length).toBeGreaterThan(0);
      expect(beatForLevel(b.level)?.title).toBe(b.title);
    }
  });

  it('aligns style soft-gates with ADR-003', () => {
    expect(STYLE_UNLOCK.luxury).toBe(20);
    expect(STYLE_UNLOCK.fantasy).toBe(40);
  });
});
