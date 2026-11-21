import { describe, expect, it } from 'vitest';
import { gemCell } from './cell';
import { findMatches } from './matches';
import type { Cell, GemColor } from './types';

function gridFrom(rows: string[]): Cell[][] {
  return rows.map((row) =>
    [...row].map((ch) => {
      const map: Record<string, GemColor> = {
        M: 'mango',
        D: 'dragon',
        L: 'lime',
        P: 'passion',
        B: 'blue',
        '.': 'mango',
      };
      if (ch === '.') return { gem: null, power: null, blocker: null, blockerLayers: 0 };
      return gemCell(map[ch]!);
    }),
  );
}

describe('findMatches', () => {
  it('finds horizontal three', () => {
    const grid = gridFrom(['DLPB', 'MMML', 'PBDL', 'BDLP']);
    const m = findMatches(grid);
    expect(m.some((x) => x.cells.length >= 3 && x.color === 'mango')).toBe(true);
  });

  it('creates rocket for four in a row', () => {
    const grid = gridFrom(['DLPBD', 'XXXXX', 'PBDLP', 'BDLPB', 'DLPBD']);
    grid[1] = ['mango', 'mango', 'mango', 'mango', 'lime'].map((c) =>
      c === 'lime' ? gemCell('lime') : gemCell('mango'),
    );
    const m = findMatches(grid);
    const rocket = m.find((x) => x.power === 'rocket_h');
    expect(rocket).toBeTruthy();
  });

  it('creates pearl for five in a row', () => {
    const grid = gridFrom(['DLPBDL', 'MMMMMM', 'PBDLPB', 'BDLPBD', 'DLPBDL', 'LPBDLP']);
    grid[1] = Array.from({ length: 6 }, () => gemCell('mango'));
    const m = findMatches(grid);
    expect(m.some((x) => x.power === 'pearl')).toBe(true);
  });

  it('creates bomb for T shape', () => {
    const grid = gridFrom([
      'DLPBDL',
      'DMMMDL',
      'DPMPDL',
      'DPMBDL',
      'DLPBDL',
      'LPBDLP',
    ]);
    // Make T: horizontal MMM at r1 c1-3 and vertical from r1c2 down
    grid[1]![1] = gemCell('mango');
    grid[1]![2] = gemCell('mango');
    grid[1]![3] = gemCell('mango');
    grid[2]![2] = gemCell('mango');
    grid[3]![2] = gemCell('mango');
    const m = findMatches(grid);
    expect(m.some((x) => x.power === 'bomb')).toBe(true);
  });

  it('creates propeller for 2x2', () => {
    const grid = gridFrom([
      'DLPBDL',
      'DMMBDL',
      'DMMBDL',
      'PBDLPB',
      'BDLPBD',
      'DLPBDL',
    ]);
    const m = findMatches(grid);
    expect(m.some((x) => x.power === 'propeller')).toBe(true);
  });
});
