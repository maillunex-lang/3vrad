import { describe, expect, it } from 'vitest';
import { Match3Engine } from '../engine';
import { CAMPAIGN_DRAFT, CAMPAIGN_DRAFT_STATUS, campaignLevel } from './campaignDraft';

describe('campaign DRAFT pack', () => {
  it('has 100 levels marked DRAFT', () => {
    expect(CAMPAIGN_DRAFT_STATUS).toBe('DRAFT_NOT_APPROVED');
    expect(CAMPAIGN_DRAFT).toHaveLength(100);
    expect(CAMPAIGN_DRAFT.every((l) => l.meta.draft)).toBe(true);
  });

  it('covers I1 1–70 and I2 71–100', () => {
    expect(campaignLevel(1)?.meta.island).toBe('I1');
    expect(campaignLevel(70)?.meta.island).toBe('I1');
    expect(campaignLevel(71)?.meta.island).toBe('I2');
    expect(campaignLevel(100)?.meta.island).toBe('I2');
  });

  it('keeps board sizes in 6×6–9×9 and builds without throw', () => {
    for (const level of CAMPAIGN_DRAFT) {
      expect(level.width).toBeGreaterThanOrEqual(6);
      expect(level.width).toBeLessThanOrEqual(9);
      expect(level.height).toBeGreaterThanOrEqual(6);
      expect(level.height).toBeLessThanOrEqual(9);
      expect(level.goals.length).toBeGreaterThan(0);
      const eng = new Match3Engine(level);
      expect(eng.snapshot().status).toBe('playing');
      expect(eng.snapshot().movesLeft).toBe(level.moves);
    }
  });

  it('difficulty mix roughly 70/23/7', () => {
    const counts = { normal: 0, hard: 0, super: 0 };
    for (const l of CAMPAIGN_DRAFT) counts[l.meta.difficulty]++;
    expect(counts.normal).toBeGreaterThanOrEqual(65);
    expect(counts.hard).toBeGreaterThanOrEqual(18);
    expect(counts.super).toBeGreaterThanOrEqual(5);
  });
});
