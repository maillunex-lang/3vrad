import type { LevelDef } from '../types';

/** Space-separated cell codes. See parseCellCode. */
export const VERIFY_LEVELS: LevelDef[] = [
  {
    id: 'v01-swap-three',
    width: 6,
    height: 6,
    moves: 15,
    seed: 101,
    goals: [{ kind: 'collect_color', color: 'mango', count: 3 }],
    // Vertical setup col2: M,M,D,M — swap (2,2)-(3,2) → MMM
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
    id: 'v02-score',
    width: 6,
    height: 6,
    moves: 20,
    seed: 102,
    goals: [{ kind: 'score', count: 30 }],
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
    id: 'v03-vertical',
    width: 6,
    height: 6,
    moves: 15,
    seed: 103,
    goals: [{ kind: 'collect_color', color: 'lime', count: 3 }],
    // col2: L,L,D,L — swap (2,2)-(3,2)
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
    id: 'v04-seven',
    width: 7,
    height: 7,
    moves: 20,
    seed: 104,
    goals: [{ kind: 'collect_color', color: 'dragon', count: 3 }],
    // col3: D,D,M,D — swap (2,3)-(3,3)
    initialGrid: [
      'M L P D M L P',
      'B M L D B M L',
      'P B M L P B M',
      'L P B D L P B',
      'M L P B M L P',
      'B M L P B M L',
      'P B M L P B M',
    ],
  },
  {
    id: 'v05-crates',
    width: 6,
    height: 6,
    moves: 25,
    seed: 105,
    goals: [{ kind: 'break_blocker', blocker: 'crate', count: 1 }],
    // Match next to crate at (2,4)
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
    id: 'v06-ice',
    width: 6,
    height: 6,
    moves: 25,
    seed: 106,
    goals: [{ kind: 'break_blocker', blocker: 'ice', count: 1 }],
    initialGrid: [
      'L P M B L P',
      'B D M P B D',
      'P B D I1P P B',
      'D L M P D L',
      'L P B D L P',
      'B D L P B D',
    ],
  },
  {
    id: 'v07-rocket-setup',
    width: 7,
    height: 6,
    moves: 20,
    seed: 107,
    goals: [{ kind: 'score', count: 30 }],
    // Horizontal four after swap: row2 M M D M P — swap D↔M → MMMM? need 4th
    // Use M M D M M at row2 cols1-5, swap D with side M from col0? 
    // Pattern: cols 1..5 = M M D M L, bring M from row3 under D.
    initialGrid: [
      'L P B D L P B',
      'B D L P B D L',
      'P M M D M L B',
      'D L P M P L P',
      'L P B D L P B',
      'B D L P B D L',
    ],
  },
  {
    id: 'v08-dual-goals',
    width: 7,
    height: 7,
    moves: 28,
    seed: 108,
    goals: [
      { kind: 'collect_color', color: 'passion', count: 3 },
      { kind: 'score', count: 30 },
    ],
    // col2: P,P,M,P
    initialGrid: [
      'M D P B M D L',
      'B M P L B M D',
      'L B M D L B M',
      'D L P B D L B',
      'M D L B M D L',
      'B M D L B M D',
      'L B M D L B M',
    ],
  },
  {
    id: 'v09-large',
    width: 8,
    height: 8,
    moves: 30,
    seed: 109,
    goals: [{ kind: 'collect_color', color: 'blue', count: 6 }],
    initialGrid: [
      'M D L P M D L P',
      'P B M D L P B M',
      'D L P B D L P B',
      'L P B M L P B D',
      'M D L P M D L P',
      'P B M D L P B M',
      'D L P B D L P B',
      'L P B M L P B D',
    ],
  },
  {
    id: 'v10-nine',
    width: 9,
    height: 9,
    moves: 35,
    seed: 110,
    goals: [
      { kind: 'score', count: 30 },
      { kind: 'collect_color', color: 'mango', count: 3 },
    ],
    // col4: M,M,D,M — swap (2,4)-(3,4); rest checker-like without opening matches
    initialGrid: [
      'D L P B M L P B D',
      'P B D L M B D L P',
      'B D L P D D L P B',
      'L P B D M L P B D',
      'D L P B D L P B D',
      'P B D L P B D L P',
      'B D L P B D L P B',
      'L P B D L P B D L',
      'D L P B D L P B D',
    ],
  },
];

export function getVerifyLevel(id: string): LevelDef {
  const lvl = VERIFY_LEVELS.find((l) => l.id === id);
  if (!lvl) throw new Error(`Unknown verify level ${id}`);
  return lvl;
}
