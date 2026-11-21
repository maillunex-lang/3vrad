/**
 * Hand-authored boards for campaign levels 21–40 (E07 ch3–4).
 * Obstacles follow LEVELS_001_DRAFT (ice ↔ crates). DRAFT balance.
 */
export type AuthoredGrid = {
  levelNo: number;
  width: number;
  height: number;
  initialGrid: string[];
};

export const CH2: AuthoredGrid[] = [
  // 21 — ice, 7×7
  {
    levelNo: 21,
    width: 7,
    height: 7,
    initialGrid: [
      'L P M B L P M',
      'B D I1M P B D L',
      'P B D L P B D',
      'D L M P D L M',
      'L P I1B D L P B',
      'B D L P B D L',
      'P B D L P B D',
    ],
  },
  // 22 — crates
  {
    levelNo: 22,
    width: 7,
    height: 7,
    initialGrid: [
      'M L P B M L P',
      'D M L C1 D M L',
      'P B M D P B M',
      'L P B M L P B',
      'M L C1 B M L P',
      'D M L P D M L',
      'P B M D P B M',
    ],
  },
  // 23 — ice
  {
    levelNo: 23,
    width: 7,
    height: 7,
    initialGrid: [
      'P M B L P M B',
      'L P I1M B L P M',
      'B L P M B L P',
      'M B L P M B L',
      'P M I1D L P M B',
      'L P M B L P M',
      'B L P M B L P',
    ],
  },
  // 24 — crates, hard
  {
    levelNo: 24,
    width: 7,
    height: 7,
    initialGrid: [
      'L D M P L D M',
      'P L C1 D P L D',
      'M P L D M P L',
      'D M P L D M P',
      'L D C1 P L D M',
      'P L D M P L D',
      'M P L C1 M P L',
    ],
  },
  // 25 — ice
  {
    levelNo: 25,
    width: 7,
    height: 7,
    initialGrid: [
      'B M P L B M P',
      'L B I1P M L B M',
      'P L B M P L B',
      'M P L B M P L',
      'B M I1L P B M P',
      'L B M P L B M',
      'P L B M P L B',
    ],
  },
  // 26 — crates
  {
    levelNo: 26,
    width: 7,
    height: 7,
    initialGrid: [
      'M P L D M P L',
      'D M C1 L D M P',
      'L D M P L D M',
      'P L D M P L D',
      'M P C1 D M P L',
      'D M P L D M P',
      'L D M P L D M',
    ],
  },
  // 27 — ice
  {
    levelNo: 27,
    width: 7,
    height: 7,
    initialGrid: [
      'P L B M P L B',
      'M P I1L B M P L',
      'B M P L B M P',
      'L B M P L B M',
      'P L I1B M P L B',
      'M P L B M P L',
      'B M P L B M P',
    ],
  },
  // 28 — crates, hard
  {
    levelNo: 28,
    width: 7,
    height: 7,
    initialGrid: [
      'D L P B D L P',
      'B D C1 P B D L',
      'P B D L P B D',
      'L P B D L P B',
      'D L C1 B D L P',
      'B D L P B D L',
      'P B C1 L P B D',
    ],
  },
  // 29 — ice
  {
    levelNo: 29,
    width: 7,
    height: 7,
    initialGrid: [
      'L M D P L M D',
      'P L I1M D P L M',
      'D P L M D P L',
      'M D P L M D P',
      'L M I1P D L M D',
      'P L M D P L M',
      'D P L M D P L',
    ],
  },
  // 30 — crates, chapter beat
  {
    levelNo: 30,
    width: 7,
    height: 7,
    initialGrid: [
      'B P M L B P M',
      'L B C1 M L B P',
      'M L B P M L B',
      'P M L B P M L',
      'B P C1 L B P M',
      'L B M P L B M',
      'M L C1 B M L B',
    ],
  },
  // 31 — crates, 8×7
  {
    levelNo: 31,
    width: 8,
    height: 7,
    initialGrid: [
      'L P M B L P M B',
      'B D M C1 B D M L',
      'P B D L P B D M',
      'D L M P D L M P',
      'L P C1 D L P B M',
      'B D L P B D L M',
      'P B D L P B D M',
    ],
  },
  // 32 — ice, hard
  {
    levelNo: 32,
    width: 8,
    height: 7,
    initialGrid: [
      'M L P B M L P B',
      'D M I1L P D M L P',
      'P B M D P B M D',
      'L P B M L P B M',
      'M L I1P B M L P B',
      'D M L P D M L P',
      'P B M D P B M D',
    ],
  },
  // 33 — crates
  {
    levelNo: 33,
    width: 8,
    height: 7,
    initialGrid: [
      'P M B L P M B L',
      'L P C1 B L P M B',
      'B L P M B L P M',
      'M B L P M B L P',
      'P M C1 L P M B L',
      'L P M B L P M B',
      'B L P M B L P M',
    ],
  },
  // 34 — ice
  {
    levelNo: 34,
    width: 8,
    height: 7,
    initialGrid: [
      'L D M P L D M P',
      'P L I1D M P L D M',
      'M P L D M P L D',
      'D M P L D M P L',
      'L D I1M P L D M P',
      'P L D M P L D M',
      'M P L D M P L D',
    ],
  },
  // 35 — crates, super
  {
    levelNo: 35,
    width: 8,
    height: 7,
    initialGrid: [
      'B M P L B M P L',
      'L B C1 P L B M P',
      'P L B M P L B M',
      'M P L B M P L B',
      'B M C1 L B M P L',
      'L B M P L B C1 M',
      'P L B M P L B M',
    ],
  },
  // 36 — ice
  {
    levelNo: 36,
    width: 8,
    height: 7,
    initialGrid: [
      'M P L D M P L D',
      'D M I1P L D M P L',
      'L D M P L D M P',
      'P L D M P L D M',
      'M P I1L D M P L D',
      'D M P L D M P L',
      'L D M P L D M P',
    ],
  },
  // 37 — crates
  {
    levelNo: 37,
    width: 8,
    height: 7,
    initialGrid: [
      'P L B M P L B M',
      'M P C1 L M P L B',
      'B M P L B M P L',
      'L B M P L B M P',
      'P L C1 M P L B M',
      'M P L B M P L B',
      'B M P L B M P L',
    ],
  },
  // 38 — ice
  {
    levelNo: 38,
    width: 8,
    height: 7,
    initialGrid: [
      'D L P B D L P B',
      'B D I1L P B D L P',
      'P B D L P B D L',
      'L P B D L P B D',
      'D L I1P B D L P B',
      'B D L P B D L P',
      'P B D L P B D L',
    ],
  },
  // 39 — crates, hard
  {
    levelNo: 39,
    width: 8,
    height: 7,
    initialGrid: [
      'L M D P L M D P',
      'P L C1 D P L M D',
      'D P L M D P L M',
      'M D P L M D P L',
      'L M C1 P L M D P',
      'P L D M P L C1 D',
      'D P L M D P L M',
    ],
  },
  // 40 — ice, chapter beat
  {
    levelNo: 40,
    width: 8,
    height: 7,
    initialGrid: [
      'B P M L B P M L',
      'L B I1P M L B P M',
      'M L B P M L B P',
      'P M L B P M L B',
      'B P I1M L B P M L',
      'L B M P L B M P',
      'M L I1B P M L B P',
    ],
  },
];
