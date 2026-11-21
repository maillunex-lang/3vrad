import type { BlockerKind, GemColor, GoalDef, LevelDef } from '../types';
import { authoredGridFor } from './authoredChapter1';

/**
 * Playable campaign built from LEVELS_001_DRAFT.md.
 * Status: DRAFT — not approved balance. Goals/moves/blockers are provisional
 * mappings for playability until LEVELS-001 is owner-approved.
 */
export const CAMPAIGN_DRAFT_STATUS = 'DRAFT_NOT_APPROVED' as const;

type Diff = 'normal' | 'hard' | 'super';
type Obst = 'none' | 'crate' | 'ice';

type Row = {
  n: number;
  island: 'I1' | 'I2';
  chapter: number;
  diff: Diff;
  w: number;
  h: number;
  moves: number;
  coins: number;
  obst: Obst;
  goalKinds: Array<'collect' | 'score' | 'break' | 'fruit'>;
};

/** Compact encoding of the draft table (obstacle families map to crate/ice). */
const ROWS: Row[] = [
  // Ch1 1–10
  r(1, 'I1', 1, 'normal', 6, 6, 30, 50, 'none', ['collect']),
  r(2, 'I1', 1, 'normal', 6, 6, 31, 50, 'none', ['score']),
  r(3, 'I1', 1, 'normal', 6, 6, 32, 50, 'none', ['break']),
  r(4, 'I1', 1, 'normal', 6, 6, 33, 50, 'none', ['collect']),
  r(5, 'I1', 1, 'normal', 6, 6, 29, 50, 'none', ['score']),
  r(6, 'I1', 1, 'normal', 6, 6, 30, 50, 'none', ['break']),
  r(7, 'I1', 1, 'hard', 6, 6, 28, 80, 'none', ['collect']),
  r(8, 'I1', 1, 'normal', 6, 6, 32, 50, 'none', ['score']),
  r(9, 'I1', 1, 'normal', 6, 6, 33, 50, 'none', ['break']),
  r(10, 'I1', 1, 'super', 6, 6, 24, 120, 'none', ['collect']),
  // Ch2 11–20 crates
  r(11, 'I1', 2, 'normal', 7, 6, 30, 50, 'crate', ['fruit']),
  r(12, 'I1', 2, 'normal', 7, 6, 31, 50, 'crate', ['collect']),
  r(13, 'I1', 2, 'normal', 7, 6, 32, 50, 'crate', ['score']),
  r(14, 'I1', 2, 'hard', 7, 6, 30, 80, 'crate', ['fruit']),
  r(15, 'I1', 2, 'normal', 7, 6, 29, 50, 'crate', ['collect']),
  r(16, 'I1', 2, 'normal', 7, 6, 30, 50, 'crate', ['score']),
  r(17, 'I1', 2, 'normal', 7, 6, 31, 50, 'crate', ['fruit']),
  r(18, 'I1', 2, 'hard', 7, 6, 29, 80, 'crate', ['collect']),
  r(19, 'I1', 2, 'normal', 7, 6, 33, 50, 'crate', ['score']),
  r(20, 'I1', 2, 'super', 7, 6, 23, 120, 'crate', ['fruit']),
  // Ch3 21–30 ice/crate mix
  ...chapterRange(21, 30, 'I1', 3, 7, 7, 'ice'),
  // Ch4 31–40
  ...chapterRange(31, 40, 'I1', 4, 8, 7, 'crate'),
  // Ch5 41–50 (shells→crate)
  ...chapterRange(41, 50, 'I1', 5, 8, 7, 'crate'),
  // Ch6 51–60 (sand→ice)
  ...chapterRange(51, 60, 'I1', 6, 8, 8, 'ice'),
  // Ch7 61–70 (vines→crate) sizes grow
  ...chapterRange(61, 65, 'I1', 7, 8, 8, 'crate'),
  ...chapterRange(66, 70, 'I1', 7, 9, 8, 'crate'),
  // I2 Ch8–10
  ...chapterRange(71, 75, 'I2', 8, 9, 8, 'crate'),
  ...chapterRange(76, 80, 'I2', 8, 9, 9, 'ice'),
  ...chapterRange(81, 90, 'I2', 9, 9, 9, 'crate'),
  ...chapterRange(91, 100, 'I2', 10, 9, 9, 'ice'),
];

function r(
  n: number,
  island: 'I1' | 'I2',
  chapter: number,
  diff: Diff,
  w: number,
  h: number,
  moves: number,
  coins: number,
  obst: Obst,
  goalKinds: Row['goalKinds'],
): Row {
  return { n, island, chapter, diff, w, h, moves, coins, obst, goalKinds };
}

/** Fill draft rows for a chapter using LEVELS_001 moves/coins patterns when exact row missing. */
function chapterRange(
  from: number,
  to: number,
  island: 'I1' | 'I2',
  chapter: number,
  w: number,
  h: number,
  obst: Obst,
): Row[] {
  const out: Row[] = [];
  for (let n = from; n <= to; n++) {
    const inChapter = n - (chapter - 1) * 10;
    const diff: Diff =
      n % 10 === 0 && [10, 20, 50, 70, 85, 100].includes(n)
        ? 'super'
        : [7, 14, 18, 24, 28, 32, 39, 43, 45, 47, 54, 58, 60, 62, 66, 73, 77, 81, 88, 91, 94, 97, 99].includes(n)
          ? 'hard'
          : 'normal';
    // Prefer exact table values for known supers/hard; else provisional.
    const moves = diff === 'super' ? 21 + (n % 3) : diff === 'hard' ? 25 + (n % 4) : 27 + (n % 5);
    const coins = diff === 'super' ? 120 : diff === 'hard' ? 80 : 50;
    const cycle: Row['goalKinds'][] = [
      ['fruit'],
      ['collect'],
      ['score'],
      ['fruit', 'break'],
      ['collect', 'score'],
      ['break', 'collect'],
      ['score', 'fruit'],
      ['fruit', 'break', 'collect'],
      ['break', 'collect', 'score'],
      ['score', 'fruit', 'break'],
    ];
    out.push(r(n, island, chapter, diff, w, h, moves, coins, obst, cycle[(inChapter - 1) % cycle.length]!));
  }
  return out;
}

// Patch first 20 already defined; chapterRange for 21+ may duplicate if ROWS already has them.
// Deduplicate by level number, prefer earlier explicit rows.
function buildRows(): Row[] {
  const map = new Map<number, Row>();
  for (const row of ROWS) map.set(row.n, row);
  // Ensure 1–100 present
  for (let n = 1; n <= 100; n++) {
    if (!map.has(n)) {
      map.set(n, r(n, n <= 70 ? 'I1' : 'I2', Math.ceil(n / 10), 'normal', 8, 8, 30, 50, 'crate', ['collect']));
    }
  }
  return [...map.values()].sort((a, b) => a.n - b.n);
}

const COLORS: GemColor[] = ['mango', 'dragon', 'lime', 'passion', 'blue'];

function goalsFor(row: Row): GoalDef[] {
  const mult = row.diff === 'super' ? 1.4 : row.diff === 'hard' ? 1.2 : 1;
  const out: GoalDef[] = [];
  for (const k of row.goalKinds.slice(0, 3)) {
    if (k === 'score') {
      out.push({ kind: 'score', count: Math.round((row.w * row.h * 8) * mult) });
    } else if (k === 'break') {
      const blocker: BlockerKind = row.obst === 'ice' ? 'ice' : 'crate';
      out.push({ kind: 'break_blocker', blocker, count: Math.max(3, Math.round(4 * mult)) });
    } else {
      // collect / fruit → color collect
      const color = COLORS[(row.n + (k === 'fruit' ? 1 : 0)) % COLORS.length]!;
      out.push({
        kind: 'collect_color',
        color,
        count: Math.max(8, Math.round((10 + row.chapter) * mult)),
      });
    }
  }
  return out.length ? out : [{ kind: 'score', count: 50 }];
}

function seedBlockers(level: LevelDef, obst: Obst, count: number): void {
  if (obst === 'none' || count <= 0) return;
  // Deterministic scatter via seed walk
  let x = level.seed >>> 0;
  const next = () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x;
  };
  const codes = level.initialGrid!;
  let placed = 0;
  let guard = 0;
  while (placed < count && guard++ < 500) {
    const rr = next() % level.height;
    const cc = next() % level.width;
    const row = codes[rr]!.split(' ');
    if (row[cc] === '.' || row[cc]?.startsWith('C') || row[cc]?.startsWith('I')) continue;
    const gem = row[cc] ?? 'M';
    row[cc] = obst === 'ice' ? `I1${gem}` : 'C1';
    codes[rr] = row.join(' ');
    placed++;
  }
}

function randomFillGrid(w: number, h: number, seed: number): string[] {
  let x = seed >>> 0;
  const next = () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x;
  };
  const letters = ['M', 'D', 'L', 'P', 'B'];
  const rows: string[] = [];
  for (let r = 0; r < h; r++) {
    const cells: string[] = [];
    for (let c = 0; c < w; c++) {
      cells.push(letters[next() % letters.length]!);
    }
    rows.push(cells.join(' '));
  }
  return rows;
}

export type CampaignMeta = {
  levelNo: number;
  island: 'I1' | 'I2';
  chapter: number;
  difficulty: Diff;
  coinsBase: number;
  draft: true;
};

export type CampaignLevel = LevelDef & { meta: CampaignMeta };

export function buildCampaignDraft(): CampaignLevel[] {
  const rows = buildRows();
  return rows.map((row) => {
    const seed = 10_000 + row.n * 97;
    const authored = authoredGridFor(row.n);
    const level: CampaignLevel = {
      id: `c${String(row.n).padStart(3, '0')}`,
      width: authored?.width ?? row.w,
      height: authored?.height ?? row.h,
      moves: row.moves,
      seed,
      goals: goalsFor(row),
      initialGrid: authored
        ? authored.initialGrid.map((line) => line)
        : randomFillGrid(row.w, row.h, seed),
      colors: [...COLORS],
      meta: {
        levelNo: row.n,
        island: row.island,
        chapter: row.chapter,
        difficulty: row.diff,
        coinsBase: row.coins,
        draft: true,
      },
    };
    // Authored boards already place teach crates; only seed extras on RNG fills.
    if (!authored) {
      if (row.obst !== 'none') {
        const count = row.diff === 'super' ? 10 : row.diff === 'hard' ? 7 : 5;
        seedBlockers(level, row.obst, count);
      }
      if (row.goalKinds.includes('break') && row.obst === 'none') {
        seedBlockers(level, 'crate', 4);
      }
    }
    return level;
  });
}

export const CAMPAIGN_DRAFT: CampaignLevel[] = buildCampaignDraft();

export function campaignLevel(n: number): CampaignLevel | undefined {
  return CAMPAIGN_DRAFT[n - 1];
}
