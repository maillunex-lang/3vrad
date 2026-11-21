import type { Cell, GemColor, Pos, PowerKind } from './types';

export type MatchGroup = {
  cells: Pos[];
  color: GemColor;
  power: PowerKind | null;
  /** Anchor where special is spawned (or first cell). */
  anchor: Pos;
};

function key(p: Pos): string {
  return `${p.r},${p.c}`;
}

function gemAt(grid: Cell[][], r: number, c: number): GemColor | null {
  const cell = grid[r]?.[c];
  if (!cell || cell.power) return null;
  if (cell.blocker === 'crate') return null;
  if (cell.blocker === 'ice' && cell.blockerLayers > 0) return null;
  return cell.gem;
}

/** Find all match groups and decide special creations. */
export function findMatches(grid: Cell[][]): MatchGroup[] {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const visitedLine = new Set<string>();
  const lineGroups: { cells: Pos[]; color: GemColor; horizontal: boolean }[] = [];

  // Horizontal runs
  for (let r = 0; r < h; r++) {
    let c = 0;
    while (c < w) {
      const color = gemAt(grid, r, c);
      if (!color) {
        c++;
        continue;
      }
      let end = c + 1;
      while (end < w && gemAt(grid, r, end) === color) end++;
      if (end - c >= 3) {
        const cells: Pos[] = [];
        for (let x = c; x < end; x++) cells.push({ r, c: x });
        lineGroups.push({ cells, color, horizontal: true });
        for (const p of cells) visitedLine.add(key(p));
      }
      c = end;
    }
  }

  // Vertical runs
  for (let c = 0; c < w; c++) {
    let r = 0;
    while (r < h) {
      const color = gemAt(grid, r, c);
      if (!color) {
        r++;
        continue;
      }
      let end = r + 1;
      while (end < h && gemAt(grid, end, c) === color) end++;
      if (end - r >= 3) {
        const cells: Pos[] = [];
        for (let y = r; y < end; y++) cells.push({ r: y, c });
        lineGroups.push({ cells, color, horizontal: false });
        for (const p of cells) visitedLine.add(key(p));
      }
      r = end;
    }
  }

  // Merge overlapping same-color groups (T/L)
  const merged = mergeGroups(lineGroups);

  // 2x2 propellers — only if cells not already in a higher special
  const usedForSpecial = new Set<string>();
  const result: MatchGroup[] = [];

  for (const g of merged) {
    const power = classifyLineSpecial(g);
    const anchor = pickAnchor(g.cells);
    result.push({ cells: g.cells, color: g.color, power, anchor });
    if (power) for (const p of g.cells) usedForSpecial.add(key(p));
  }

  for (let r = 0; r < h - 1; r++) {
    for (let c = 0; c < w - 1; c++) {
      const color = gemAt(grid, r, c);
      if (!color) continue;
      const square: Pos[] = [
        { r, c },
        { r, c: c + 1 },
        { r: r + 1, c },
        { r: r + 1, c: c + 1 },
      ];
      if (!square.every((p) => gemAt(grid, p.r, p.c) === color)) continue;
      if (square.some((p) => usedForSpecial.has(key(p)))) continue;
      // Skip if already covered entirely by a line match without special? Still create propeller if pure 2x2.
      const already = result.some(
        (mg) =>
          mg.color === color &&
          square.every((p) => mg.cells.some((q) => q.r === p.r && q.c === p.c)),
      );
      if (already) {
        // Upgrade plain 3-line that fully contains square? Prefer propeller only when no higher special.
        const host = result.find(
          (mg) =>
            mg.color === color &&
            square.every((p) => mg.cells.some((q) => q.r === p.r && q.c === p.c)),
        );
        if (host && !host.power) {
          host.power = 'propeller';
          host.anchor = { r, c };
          for (const p of square) usedForSpecial.add(key(p));
        }
        continue;
      }
      result.push({
        cells: square,
        color,
        power: 'propeller',
        anchor: { r, c },
      });
      for (const p of square) usedForSpecial.add(key(p));
    }
  }

  return result;
}

function mergeGroups(
  lineGroups: { cells: Pos[]; color: GemColor; horizontal: boolean }[],
): { cells: Pos[]; color: GemColor; horizontals: boolean; verticals: boolean; maxLine: number }[] {
  type Acc = {
    cells: Map<string, Pos>;
    color: GemColor;
    horizontals: boolean;
    verticals: boolean;
    maxLine: number;
  };
  const accs: Acc[] = [];

  for (const g of lineGroups) {
    const keys = g.cells.map(key);
    let found: Acc | undefined;
    for (const a of accs) {
      if (a.color !== g.color) continue;
      if (keys.some((k) => a.cells.has(k))) {
        found = a;
        break;
      }
    }
    if (!found) {
      found = {
        cells: new Map(),
        color: g.color,
        horizontals: false,
        verticals: false,
        maxLine: 0,
      };
      accs.push(found);
    }
    for (const p of g.cells) found.cells.set(key(p), p);
    if (g.horizontal) found.horizontals = true;
    else found.verticals = true;
    found.maxLine = Math.max(found.maxLine, g.cells.length);
  }

  // Merge connected components of same color (union if share cell)
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < accs.length; i++) {
      for (let j = i + 1; j < accs.length; j++) {
        const a = accs[i]!;
        const b = accs[j]!;
        if (a.color !== b.color) continue;
        const share = [...a.cells.keys()].some((k) => b.cells.has(k));
        if (!share) continue;
        for (const [k, p] of b.cells) a.cells.set(k, p);
        a.horizontals ||= b.horizontals;
        a.verticals ||= b.verticals;
        a.maxLine = Math.max(a.maxLine, b.maxLine);
        accs.splice(j, 1);
        changed = true;
        break;
      }
      if (changed) break;
    }
  }

  return accs.map((a) => ({
    cells: [...a.cells.values()],
    color: a.color,
    horizontals: a.horizontals,
    verticals: a.verticals,
    maxLine: a.maxLine,
  }));
}

function classifyLineSpecial(g: {
  cells: Pos[];
  color: GemColor;
  horizontals: boolean;
  verticals: boolean;
  maxLine: number;
}): PowerKind | null {
  const n = g.cells.length;
  // Pearl: straight 5+
  if (g.maxLine >= 5 && !(g.horizontals && g.verticals)) {
    return 'pearl';
  }
  if (g.maxLine >= 5 && g.horizontals && g.verticals) {
    // T/L with a long arm — bomb takes priority over pearl per ADR (bomb for T/L)
    return 'bomb';
  }
  // Bomb: T or L (both orientations present) and >=5 cells
  if (g.horizontals && g.verticals && n >= 5) return 'bomb';
  // Rocket: exactly 4 in a straight line (no branch)
  if (!g.horizontals || !g.verticals) {
    if (g.maxLine >= 5) return 'pearl';
    if (g.maxLine === 4) return g.horizontals ? 'rocket_h' : 'rocket_v';
  }
  // Branched 4 — treat as normal clear (no special) unless T with 5+
  return null;
}

function pickAnchor(cells: Pos[]): Pos {
  return [...cells].sort((a, b) => a.r - b.r || a.c - b.c)[0]!;
}

export function boardHasMatch(grid: Cell[][]): boolean {
  return findMatches(grid).length > 0;
}
