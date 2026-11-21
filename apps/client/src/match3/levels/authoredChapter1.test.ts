import { describe, expect, it } from 'vitest';
import { Match3Engine } from '../engine';
import { authoredCount, authoredGridFor } from './authoredChapter1';
import { campaignLevel } from './campaignDraft';

describe('authored chapter 1–20', () => {
  it('covers levels 1–20', () => {
    expect(authoredCount()).toBe(20);
    for (let n = 1; n <= 20; n++) {
      expect(authoredGridFor(n)?.levelNo).toBe(n);
    }
  });

  it('builds into campaign engines without throw', () => {
    for (let n = 1; n <= 20; n++) {
      const level = campaignLevel(n)!;
      expect(level.initialGrid?.length).toBe(level.height);
      const eng = new Match3Engine(level);
      expect(eng.snapshot().status).toBe('playing');
    }
  });

  it('keeps at least one legal hint on level 1', () => {
    const eng = new Match3Engine(campaignLevel(1)!);
    expect(eng.findHints().length).toBeGreaterThan(0);
  });
});
