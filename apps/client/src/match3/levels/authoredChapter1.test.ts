import { describe, expect, it } from 'vitest';
import { Match3Engine } from '../engine';
import { authoredCount, authoredGridFor } from './authoredChapter1';
import { campaignLevel } from './campaignDraft';

describe('authored chapter 1–40', () => {
  it('covers levels 1–40', () => {
    expect(authoredCount()).toBe(40);
    for (let n = 1; n <= 40; n++) {
      expect(authoredGridFor(n)?.levelNo).toBe(n);
    }
  });

  it('builds into campaign engines without throw', () => {
    for (let n = 1; n <= 40; n++) {
      const level = campaignLevel(n)!;
      expect(level.initialGrid?.length).toBe(level.height);
      for (const row of level.initialGrid!) {
        expect(row.trim().split(/\s+/).length).toBe(level.width);
      }
      const eng = new Match3Engine(level);
      expect(eng.snapshot().status).toBe('playing');
    }
  });

  it('keeps at least one legal hint on level 1', () => {
    const eng = new Match3Engine(campaignLevel(1)!);
    expect(eng.findHints().length).toBeGreaterThan(0);
  });

  it('places ice on odd ch3 levels and crates on even', () => {
    const ice21 = campaignLevel(21)!.initialGrid!.join(' ');
    const crate22 = campaignLevel(22)!.initialGrid!.join(' ');
    expect(ice21).toMatch(/I1[MDLPB]/);
    expect(crate22).toMatch(/\bC1\b/);
    expect(ice21).not.toMatch(/\bC1\b/);
  });
});
