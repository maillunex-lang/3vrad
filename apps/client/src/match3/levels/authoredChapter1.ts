import { CH2 } from './authoredChapter2';

/**
 * Hand-authored boards for campaign levels 1–20 (E07).
 * Still DRAFT balance (moves/goals from LEVELS_001), but grids are designed
 * for teachable swaps — not pure RNG fills.
 * Levels 21–40 live in authoredChapter2 and are merged into authoredGridFor.
 */
export type AuthoredGrid = {
  levelNo: number;
  width: number;
  height: number;
  initialGrid: string[];
};

const CH1: AuthoredGrid[] = [
  {
    levelNo: 1,
    width: 6,
    height: 6,
    initialGrid: [
      'L P M B L P',
      'B D M P B D',
      'P B D L P B',
      'D L M P D L',
      'L P B D L P',
      'B D L P B D',
    ],
  },
  {
    levelNo: 2,
    width: 6,
    height: 6,
    initialGrid: [
      'M L P B M L',
      'D M L P D M',
      'P B M D P B',
      'L P B M L P',
      'M L P B M L',
      'D M L P D M',
    ],
  },
  {
    levelNo: 3,
    width: 6,
    height: 6,
    initialGrid: [
      'L P M B L P',
      'B D M P B D',
      'P B D C1 P B',
      'D L M P D L',
      'L P B D L P',
      'B D L P B D',
    ],
  },
  {
    levelNo: 4,
    width: 6,
    height: 6,
    initialGrid: [
      'M P L B M P',
      'D M L P D M',
      'P B D M P B',
      'B D L P B D',
      'M P B D M P',
      'D M P B D M',
    ],
  },
  {
    levelNo: 5,
    width: 6,
    height: 6,
    initialGrid: [
      'B L M P B L',
      'P B L M P B',
      'M P B L M P',
      'L M P B L M',
      'B L M P B L',
      'P B L M P B',
    ],
  },
  {
    levelNo: 6,
    width: 6,
    height: 6,
    initialGrid: [
      'M D L P M D',
      'P M D L P M',
      'L P C1 D L P',
      'D L P M D L',
      'M D L P M D',
      'P M D L P M',
    ],
  },
  {
    levelNo: 7,
    width: 6,
    height: 6,
    initialGrid: [
      'L M P B L M',
      'B L M P B L',
      'P B L M P B',
      'M P B L M P',
      'L M P B L M',
      'B L M P B L',
    ],
  },
  {
    levelNo: 8,
    width: 6,
    height: 6,
    initialGrid: [
      'D P M L D P',
      'L D P M L D',
      'M L D P M L',
      'P M L D P M',
      'D P M L D P',
      'L D P M L D',
    ],
  },
  {
    levelNo: 9,
    width: 6,
    height: 6,
    initialGrid: [
      'M L B P M L',
      'P M L B P M',
      'B P C1 L B P',
      'L B P M L B',
      'M L B P M L',
      'P M L B P M',
    ],
  },
  {
    levelNo: 10,
    width: 6,
    height: 6,
    initialGrid: [
      'P B M L P B',
      'L P B M L P',
      'M L P B M L',
      'B M L P B M',
      'P B M L P B',
      'L P B M L P',
    ],
  },
  // Ch2 11–20 — 7×6 with crates
  {
    levelNo: 11,
    width: 7,
    height: 6,
    initialGrid: [
      'M L P D M L P',
      'B M L D B M L',
      'P B M C1 P B M',
      'L P B D L P B',
      'M L P B M L P',
      'B M L P B M L',
    ],
  },
  {
    levelNo: 12,
    width: 7,
    height: 6,
    initialGrid: [
      'L P B M L P B',
      'M L P B M L P',
      'B M L C1 B M L',
      'P B M L P B M',
      'L P B M L P B',
      'M L P B M L P',
    ],
  },
  {
    levelNo: 13,
    width: 7,
    height: 6,
    initialGrid: [
      'D M L P D M L',
      'P D M L P D M',
      'L P D C1 L P D',
      'M L P D M L P',
      'D M L P D M L',
      'P D M L P D M',
    ],
  },
  {
    levelNo: 14,
    width: 7,
    height: 6,
    initialGrid: [
      'B L M P B L M',
      'P B L M P B L',
      'M P B C1 M P B',
      'L M P B L M P',
      'B L M P B L M',
      'P B L M P B L',
    ],
  },
  {
    levelNo: 15,
    width: 7,
    height: 6,
    initialGrid: [
      'M P L B M P L',
      'D M P L D M P',
      'L D M C1 L D M',
      'P L D M P L D',
      'M P L B M P L',
      'D M P L D M P',
    ],
  },
  {
    levelNo: 16,
    width: 7,
    height: 6,
    initialGrid: [
      'L M D P L M D',
      'P L M D P L M',
      'D P L C1 D P L',
      'M D P L M D P',
      'L M D P L M D',
      'P L M D P L M',
    ],
  },
  {
    levelNo: 17,
    width: 7,
    height: 6,
    initialGrid: [
      'P M B L P M B',
      'L P M B L P M',
      'B L P C1 B L P',
      'M B L P M B L',
      'P M B L P M B',
      'L P M B L P M',
    ],
  },
  {
    levelNo: 18,
    width: 7,
    height: 6,
    initialGrid: [
      'M L D B M L D',
      'B M L D B M L',
      'D B M C1 D B M',
      'L D B M L D B',
      'M L D B M L D',
      'B M L D B M L',
    ],
  },
  {
    levelNo: 19,
    width: 7,
    height: 6,
    initialGrid: [
      'L P M D L P M',
      'D L P M D L P',
      'M D L C1 M D L',
      'P M D L P M D',
      'L P M D L P M',
      'D L P M D L P',
    ],
  },
  {
    levelNo: 20,
    width: 7,
    height: 6,
    initialGrid: [
      'B M P L B M P',
      'L B M P L B M',
      'P L B C1 P L B',
      'M P L B M P L',
      'B M P L B M P',
      'L B M P L B M',
    ],
  },
];

const BY_NO = new Map([...CH1, ...CH2].map((g) => [g.levelNo, g]));

export function authoredGridFor(levelNo: number): AuthoredGrid | undefined {
  return BY_NO.get(levelNo);
}

export function authoredCount(): number {
  return CH1.length + CH2.length;
}
