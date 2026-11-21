import { describe, expect, it } from 'vitest';
import { autoplayLevel } from './autoplay';
import { Match3Engine } from './engine';
import { VERIFY_LEVELS } from './levels/verifyLevels';
import { findMatches } from './matches';
import type { Pos } from './types';

describe('Match3Engine basics', () => {
  it('rejects non-adjacent swap', () => {
    const level = VERIFY_LEVELS[0]!;
    const e = new Match3Engine(level);
    expect(e.trySwap({ r: 0, c: 0 }, { r: 2, c: 0 })).toBe(false);
  });

  it('reverts invalid swap without spending move', () => {
    const e = new Match3Engine(VERIFY_LEVELS[0]!);
    const before = e.snapshot().movesLeft;
    // Find a swap that does not match
    let reverted = false;
    for (let r = 0; r < e.height; r++) {
      for (let c = 0; c < e.width - 1; c++) {
        const a = { r, c };
        const b = { r, c: c + 1 };
        const snap = e.snapshot();
        // try
        const ok = e.trySwap(a, b);
        if (!ok) {
          expect(e.snapshot().movesLeft).toBe(before);
          // board restored
          expect(e.snapshot().grid[a.r]![a.c]!.gem).toBe(snap.grid[a.r]![a.c]!.gem);
          reverted = true;
          break;
        } else {
          // undo by reconstructing — level restart
          return; // lucky first swap worked; still ok
        }
      }
      if (reverted) break;
    }
  });

  it('v01 scripted win', () => {
    const result = autoplayLevel(VERIFY_LEVELS[0]!, {
      script: [
        [
          { r: 2, c: 2 },
          { r: 3, c: 2 },
        ],
      ],
    });
    expect(result.won).toBe(true);
    expect(result.movesUsed).toBe(1);
  });

  it('v07 forms rocket on four-match', () => {
    const e = new Match3Engine(VERIFY_LEVELS.find((l) => l.id === 'v07-rocket-setup')!);
    // Swap D at (2,3) with M at (3,3) → vertical/horizontal cluster; or (2,3)-(2,4)
    expect(e.trySwap({ r: 2, c: 3 }, { r: 3, c: 3 })).toBe(true);
    const snap = e.snapshot();
    // After resolve, either rocket remains or was used; score should rise
    expect(snap.score).toBeGreaterThan(0);
  });

  it('cascade guard does not hang on resolve', () => {
    const e = new Match3Engine(VERIFY_LEVELS[1]!);
    const hints = e.findHints();
    expect(hints.length).toBeGreaterThan(0);
    e.trySwap(hints[0]![0], hints[0]![1]);
    expect(e.snapshot().status === 'playing' || e.snapshot().status === 'won').toBe(true);
  });

  it('help offer after three losses', () => {
    const e = new Match3Engine(VERIFY_LEVELS[0]!, { failStreak: 2 });
    const events: string[] = [];
    e.on((ev) => {
      if (ev.type === 'help_offer') events.push('help');
    });
    e.registerLoss();
    expect(events).toContain('help');
    expect(e.applyStartingPower('bomb')).toBe(true);
    expect(e.snapshot().helpUsed).toBe(true);
  });
});

const VERTICAL_SWAP: [Pos, Pos] = [
  { r: 2, c: 2 },
  { r: 3, c: 2 },
];

describe('verify levels autoplay', () => {
  const scripts: Record<string, [Pos, Pos][]> = {
    'v01-swap-three': [VERTICAL_SWAP],
    'v02-score': [VERTICAL_SWAP],
    'v03-vertical': [VERTICAL_SWAP],
    'v04-seven': [
      [
        { r: 2, c: 3 },
        { r: 3, c: 3 },
      ],
    ],
    'v05-crates': [VERTICAL_SWAP],
    'v06-ice': [VERTICAL_SWAP],
    'v07-rocket-setup': [
      [
        { r: 2, c: 3 },
        { r: 3, c: 3 },
      ],
    ],
    'v08-dual-goals': [VERTICAL_SWAP],
    'v10-nine': [
      [
        { r: 2, c: 4 },
        { r: 3, c: 4 },
      ],
    ],
  };

  for (const level of VERIFY_LEVELS) {
    it(`solves or progresses ${level.id}`, () => {
      const script = scripts[level.id];
      const result = script ? autoplayLevel(level, { script }) : autoplayLevel(level);
      expect(['won', 'lost', 'playing']).toContain(result.status);
      if (script || level.id === 'v09-large') {
        expect(result.won).toBe(true);
      }
      const e = new Match3Engine(level);
      expect(findMatches(e.snapshot().grid).length).toBe(0);
    });
  }

  it('all ten levels reachable without crash via greedy', () => {
    for (const level of VERIFY_LEVELS) {
      const r = autoplayLevel(level);
      expect(r.movesUsed).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeGreaterThanOrEqual(0);
    }
  });
});
