import {
  cloneCell,
  damageBlocker,
  emptyCell,
  gemCell,
  isSwappable,
  parseCellCode,
  powerCell,
} from './cell';
import { findMatches } from './matches';
import { createRng, pick, shuffleInPlace, type Rng } from './rng';
import type {
  Cell,
  ClearEvent,
  EngineEvent,
  EngineSnapshot,
  GameStatus,
  GemColor,
  GoalProgress,
  LevelDef,
  Pos,
  PowerKind,
} from './types';
import { GEM_COLORS } from './types';

const MAX_CASCADE_STEPS = 64;
const MAX_SCORE_MULT = 8;
const BASE_SCORE = 10;

export type EngineListener = (e: EngineEvent) => void;

export class Match3Engine {
  readonly width: number;
  readonly height: number;
  readonly levelId: string;
  private grid: Cell[][];
  private movesLeft: number;
  private score = 0;
  private cascadeMultiplier = 1;
  private goals: GoalProgress[];
  private status: GameStatus = 'playing';
  private rng: Rng;
  private colors: GemColor[];
  private listeners: EngineListener[] = [];
  private failStreak: number;
  private helpUsed: boolean;
  private pendingPearlColor: GemColor | null = null;
  private readonly initialMoves: number;

  constructor(level: LevelDef, opts?: { failStreak?: number; helpUsed?: boolean }) {
    if (level.width < 6 || level.width > 9 || level.height < 6 || level.height > 9) {
      throw new Error(`Invalid board size ${level.width}x${level.height}`);
    }
    this.width = level.width;
    this.height = level.height;
    this.levelId = level.id;
    this.initialMoves = level.moves;
    this.movesLeft = level.moves;
    this.rng = createRng(level.seed);
    this.colors = level.colors?.length ? [...level.colors] : [...GEM_COLORS];
    this.goals = level.goals.map((g) => ({ ...g, remaining: g.count }));
    this.failStreak = opts?.failStreak ?? 0;
    this.helpUsed = opts?.helpUsed ?? false;
    this.grid = this.buildInitial(level);
    // Preset grids are author-owned; only scrub random fills.
    if (!level.initialGrid?.length) {
      this.ensureNoInitialMatches();
    }
  }

  on(listener: EngineListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(e: EngineEvent): void {
    for (const l of this.listeners) l(e);
  }

  snapshot(): EngineSnapshot {
    return {
      width: this.width,
      height: this.height,
      grid: this.grid.map((row) => row.map(cloneCell)),
      movesLeft: this.movesLeft,
      score: this.score,
      cascadeMultiplier: this.cascadeMultiplier,
      goals: this.goals.map((g) => ({ ...g })),
      status: this.status,
      failStreak: this.failStreak,
      helpUsed: this.helpUsed,
      levelId: this.levelId,
    };
  }

  cellAt(r: number, c: number): Cell | undefined {
    return this.grid[r]?.[c];
  }

  /** Attempt adjacent swap. Returns false if rejected. */
  trySwap(a: Pos, b: Pos): boolean {
    if (this.status !== 'playing') return false;
    if (!this.inBounds(a) || !this.inBounds(b)) return false;
    if (Math.abs(a.r - b.r) + Math.abs(a.c - b.c) !== 1) return false;
    const ca = this.grid[a.r]![a.c]!;
    const cb = this.grid[b.r]![b.c]!;
    if (!isSwappable(ca) || !isSwappable(cb)) return false;

    const bothPowers = !!(ca.power && cb.power);
    const pearlSwap = ca.power === 'pearl' || cb.power === 'pearl';

    this.swapCells(a, b);
    this.emit({ type: 'swap', a, b });

    if (bothPowers) {
      this.movesLeft -= 1;
      this.resolvePowerCombo(a, b);
      this.afterMoveResolve();
      this.emit({ type: 'resolve_end' });
      return true;
    }

    if (pearlSwap) {
      const pearlPos = this.grid[a.r]![a.c]!.power === 'pearl' ? a : b;
      const otherPos = pearlPos === a ? b : a;
      const other = this.grid[otherPos.r]![otherPos.c]!;
      const color = other.gem ?? pick(this.rng, this.colors);
      this.pendingPearlColor = color;
      this.movesLeft -= 1;
      this.activatePower(pearlPos, 'pearl');
      this.pendingPearlColor = null;
      this.afterMoveResolve();
      this.emit({ type: 'resolve_end' });
      return true;
    }

    const matches = findMatches(this.grid);
    if (matches.length === 0) {
      this.swapCells(a, b);
      this.emit({ type: 'swap_revert', a, b });
      this.emit({ type: 'resolve_end' });
      return false;
    }

    this.movesLeft -= 1;
    this.resolveBoard();
    this.afterMoveResolve();
    this.emit({ type: 'resolve_end' });
    return true;
  }

  activateCellPower(pos: Pos): boolean {
    if (this.status !== 'playing') return false;
    const cell = this.grid[pos.r]?.[pos.c];
    if (!cell?.power) return false;
    if (!isSwappable(cell)) return false;
    this.movesLeft -= 1;
    this.activatePower(pos, cell.power);
    this.afterMoveResolve();
    this.emit({ type: 'resolve_end' });
    return true;
  }

  applyStartingPower(power: PowerKind): boolean {
    if (this.helpUsed) return false;
    if (this.failStreak < 3) return false;
    // Place on a swappable gem near center; resume attempt if offered after a loss.
    let placed: Pos | null = null;
    const cr = Math.floor(this.height / 2);
    const cc = Math.floor(this.width / 2);
    for (let radius = 0; radius < Math.max(this.width, this.height) && !placed; radius++) {
      for (let r = cr - radius; r <= cr + radius; r++) {
        for (let c = cc - radius; c <= cc + radius; c++) {
          if (!this.inBounds({ r, c })) continue;
          const cell = this.grid[r]![c]!;
          if (cell.blocker === 'crate') continue;
          if (cell.blocker === 'ice' && cell.blockerLayers > 0) continue;
          if (!cell.gem && !cell.power) continue;
          cell.power = power;
          placed = { r, c };
          break;
        }
        if (placed) break;
      }
    }
    if (!placed) return false;
    this.helpUsed = true;
    if (this.status === 'lost') {
      this.status = 'playing';
      this.movesLeft = this.initialMoves;
      this.emit({ type: 'status', status: 'playing' });
    }
    this.emit({
      type: 'power_created',
      pos: placed,
      power,
      color: this.grid[placed.r]![placed.c]!.gem ?? 'mango',
    });
    return true;
  }

  findHints(): [Pos, Pos][] {
    const hints: [Pos, Pos][] = [];
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        const a = { r, c };
        for (const b of [
          { r, c: c + 1 },
          { r: r + 1, c },
        ]) {
          if (!this.inBounds(b)) continue;
          if (!isSwappable(this.grid[a.r]![a.c]!) || !isSwappable(this.grid[b.r]![b.c]!)) continue;
          const ca = this.grid[a.r]![a.c]!;
          const cb = this.grid[b.r]![b.c]!;
          if (ca.power && cb.power) {
            hints.push([a, b]);
            continue;
          }
          if (ca.power === 'pearl' || cb.power === 'pearl') {
            hints.push([a, b]);
            continue;
          }
          this.swapCells(a, b);
          const ok = findMatches(this.grid).length > 0;
          this.swapCells(a, b);
          if (ok) hints.push([a, b]);
        }
      }
    }
    return hints;
  }

  requestHints(): [Pos, Pos][] {
    const moves = this.findHints();
    this.emit({ type: 'hint', moves });
    return moves;
  }

  /** Test helper: force lose bookkeeping. */
  registerLoss(): void {
    this.failStreak += 1;
    this.status = 'lost';
    this.emit({ type: 'status', status: 'lost' });
    if (this.failStreak >= 3 && !this.helpUsed) {
      this.emit({ type: 'help_offer', options: ['rocket_h', 'bomb'] });
    }
  }

  // ---- internals ----

  private afterMoveResolve(): void {
    this.checkGoals();
    if (this.status === 'won') return;
    if (this.movesLeft <= 0) {
      this.failStreak += 1;
      this.status = 'lost';
      this.emit({ type: 'status', status: 'lost' });
      if (this.failStreak >= 3 && !this.helpUsed) {
        this.emit({ type: 'help_offer', options: ['rocket_h', 'bomb'] });
      }
      return;
    }
    if (this.findHints().length === 0) {
      this.shuffleBoard();
    }
  }

  private checkGoals(): void {
    // score goal synced
    for (const g of this.goals) {
      if (g.kind === 'score') {
        g.remaining = Math.max(0, g.count - this.score);
      }
    }
    if (this.goals.every((g) => g.remaining <= 0)) {
      this.status = 'won';
      this.failStreak = 0;
      this.emit({ type: 'status', status: 'won' });
    }
  }

  private resolveBoard(): void {
    this.cascadeMultiplier = 1;
    let step = 0;
    while (step < MAX_CASCADE_STEPS) {
      const matches = findMatches(this.grid);
      if (matches.length === 0) break;
      this.clearMatches(matches, step);
      this.applyGravityAndFill();
      step++;
      this.cascadeMultiplier = Math.min(MAX_SCORE_MULT, step + 1);
      this.checkGoals();
      if (this.status === 'won') return;
    }
    if (step >= MAX_CASCADE_STEPS) {
      this.shuffleBoard();
    }
  }

  private clearMatches(
    matches: ReturnType<typeof findMatches>,
    cascadeStep: number,
  ): void {
    const clearMap = new Map<string, ClearEvent>();
    const specials: { pos: Pos; power: PowerKind; color: GemColor }[] = [];

    for (const m of matches) {
      for (const p of m.cells) {
        const cell = this.grid[p.r]![p.c]!;
        clearMap.set(`${p.r},${p.c}`, {
          pos: p,
          gem: cell.gem,
          power: cell.power,
        });
      }
      if (m.power) {
        specials.push({ pos: m.anchor, power: m.power, color: m.color });
      }
    }

    // Adjacent blocker damage
    for (const ev of clearMap.values()) {
      this.damageNeighbors(ev.pos);
      this.creditClear(ev.gem, null);
    }

    const scoreDelta = clearMap.size * BASE_SCORE * this.cascadeMultiplier;
    this.score += scoreDelta;

    for (const ev of clearMap.values()) {
      const cell = this.grid[ev.pos.r]![ev.pos.c]!;
      // Keep ice damage only via damageNeighbors; clearing gem under broken ice handled
      if (cell.blocker === 'ice' && cell.blockerLayers > 0) {
        // gem under ice shouldn't be in match — skip
        continue;
      }
      this.grid[ev.pos.r]![ev.pos.c] = emptyCell();
    }

    this.emit({
      type: 'clear',
      cells: [...clearMap.values()],
      cascadeStep,
      scoreDelta,
    });

    for (const s of specials) {
      const cell = this.grid[s.pos.r]![s.pos.c]!;
      // Only place if empty or we reserved anchor
      this.grid[s.pos.r]![s.pos.c] = powerCell(s.power, s.color);
      this.emit({ type: 'power_created', pos: s.pos, power: s.power, color: s.color });
      void cell;
    }
  }

  private creditClear(gem: GemColor | null, blocker: 'crate' | 'ice' | null): void {
    for (const g of this.goals) {
      if (g.remaining <= 0) continue;
      if (g.kind === 'collect_color' && gem === g.color) g.remaining -= 1;
      if (g.kind === 'break_blocker' && blocker === g.blocker) g.remaining -= 1;
    }
  }

  private damageNeighbors(pos: Pos): void {
    for (const [dr, dc] of [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const r = pos.r + dr;
      const c = pos.c + dc;
      if (!this.inBounds({ r, c })) continue;
      const cell = this.grid[r]![c]!;
      if (!cell.blocker || cell.blockerLayers <= 0) continue;
      // Center (0,0): only if this cell itself is a blocker hit by power; for matches, adjacent only
      if (dr === 0 && dc === 0) continue;
      const before = cell.blocker;
      const { destroyed, kind } = damageBlocker(cell, 1);
      if (destroyed && kind) this.creditClear(null, kind);
      void before;
    }
  }

  private hitCell(pos: Pos, fromPower?: PowerKind | string): void {
    if (!this.inBounds(pos)) return;
    const cell = this.grid[pos.r]![pos.c]!;
    if (cell.blocker && cell.blockerLayers > 0) {
      const { destroyed, kind } = damageBlocker(cell, 1);
      if (destroyed && kind) this.creditClear(null, kind);
      if (cell.blocker === 'ice' && cell.blockerLayers > 0) return;
      if (kind === 'crate' && !destroyed) return;
      if (destroyed && kind === 'crate') {
        this.emit({
          type: 'clear',
          cells: [{ pos, gem: null, power: null, fromPower }],
          cascadeStep: 0,
          scoreDelta: 0,
        });
        return;
      }
    }
    if (!cell.gem && !cell.power) return;
    const ev: ClearEvent = { pos, gem: cell.gem, power: cell.power, fromPower };
    this.creditClear(cell.gem, null);
    this.score += BASE_SCORE * this.cascadeMultiplier;
    // Chain: if clearing a power, activate it
    const chained = cell.power;
    this.grid[pos.r]![pos.c] = emptyCell();
    this.emit({
      type: 'clear',
      cells: [ev],
      cascadeStep: 0,
      scoreDelta: BASE_SCORE * this.cascadeMultiplier,
    });
    if (chained && chained !== fromPower) {
      // Place back temporarily? Already empty — activate at position with known kind
      this.activatePowerAtEmpty(pos, chained);
    }
  }

  private activatePower(pos: Pos, power: PowerKind): void {
    // Remove power cell first
    const cell = this.grid[pos.r]![pos.c]!;
    this.grid[pos.r]![pos.c] = emptyCell();
    this.emit({
      type: 'clear',
      cells: [{ pos, gem: cell.gem, power, fromPower: power }],
      cascadeStep: 0,
      scoreDelta: BASE_SCORE,
    });
    this.score += BASE_SCORE;
    this.runPowerEffect(pos, power);
    this.resolveBoard();
  }

  private activatePowerAtEmpty(pos: Pos, power: PowerKind): void {
    this.runPowerEffect(pos, power);
  }

  private runPowerEffect(pos: Pos, power: PowerKind): void {
    switch (power) {
      case 'rocket_h':
        for (let c = 0; c < this.width; c++) this.hitCell({ r: pos.r, c }, power);
        break;
      case 'rocket_v':
        for (let r = 0; r < this.height; r++) this.hitCell({ r, c: pos.c }, power);
        break;
      case 'bomb':
        for (let r = pos.r - 1; r <= pos.r + 1; r++) {
          for (let c = pos.c - 1; c <= pos.c + 1; c++) {
            this.hitCell({ r, c }, power);
          }
        }
        break;
      case 'pearl': {
        const color = this.pendingPearlColor ?? pick(this.rng, this.colors);
        for (let r = 0; r < this.height; r++) {
          for (let c = 0; c < this.width; c++) {
            const cell = this.grid[r]![c]!;
            if (cell.gem === color && !cell.power) this.hitCell({ r, c }, power);
          }
        }
        break;
      }
      case 'propeller': {
        const target = this.pickPropellerTarget(pos);
        if (target) this.hitCell(target, power);
        break;
      }
    }
  }

  private pickPropellerTarget(from: Pos): Pos | null {
    type Cand = { pos: Pos; priority: number; dist: number };
    const cands: Cand[] = [];
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        if (r === from.r && c === from.c) continue;
        const cell = this.grid[r]![c]!;
        let priority = 0;
        if (cell.blocker && cell.blockerLayers > 0) {
          const need = this.goals.some(
            (g) => g.kind === 'break_blocker' && g.blocker === cell.blocker && g.remaining > 0,
          );
          priority = need ? 3 : 2;
        } else if (cell.gem && !cell.power) {
          const need = this.goals.some(
            (g) => g.kind === 'collect_color' && g.color === cell.gem && g.remaining > 0,
          );
          priority = need ? 1 : 0;
        } else continue;
        const dist = Math.abs(r - from.r) + Math.abs(c - from.c);
        cands.push({ pos: { r, c }, priority, dist });
      }
    }
    if (!cands.length) return null;
    cands.sort((a, b) => b.priority - a.priority || a.dist - b.dist || a.pos.r - b.pos.r || a.pos.c - b.pos.c);
    return cands[0]!.pos;
  }

  private resolvePowerCombo(a: Pos, b: Pos): void {
    const pa = this.grid[a.r]![a.c]!.power!;
    const pb = this.grid[b.r]![b.c]!.power!;
    // Clear both power cells
    this.grid[a.r]![a.c] = emptyCell();
    this.grid[b.r]![b.c] = emptyCell();
    const mid = a;

    const set = new Set([pa, pb].map(normalizePower));
    const has = (k: string) => set.has(k as never);

    if (pa.startsWith('rocket') && pb.startsWith('rocket')) {
      for (let c = 0; c < this.width; c++) this.hitCell({ r: mid.r, c }, 'combo_rocket');
      for (let r = 0; r < this.height; r++) this.hitCell({ r, c: mid.c }, 'combo_rocket');
    } else if (
      (pa.startsWith('rocket') && pb === 'bomb') ||
      (pb.startsWith('rocket') && pa === 'bomb')
    ) {
      for (let r = mid.r - 1; r <= mid.r + 1; r++) {
        for (let c = 0; c < this.width; c++) this.hitCell({ r, c }, 'combo_rb');
      }
      for (let c = mid.c - 1; c <= mid.c + 1; c++) {
        for (let r = 0; r < this.height; r++) this.hitCell({ r, c }, 'combo_rb');
      }
    } else if (pa === 'bomb' && pb === 'bomb') {
      for (let r = mid.r - 2; r <= mid.r + 2; r++) {
        for (let c = mid.c - 2; c <= mid.c + 2; c++) this.hitCell({ r, c }, 'combo_bb');
      }
    } else if (has('propeller') && (has('rocket') || has('bomb'))) {
      const other = pa === 'propeller' ? pb : pa;
      const target = this.pickPropellerTarget(mid) ?? mid;
      this.runPowerEffect(target, other);
    } else if (pa === 'propeller' && pb === 'propeller') {
      const t1 = this.pickPropellerTarget(a);
      const t2 = this.pickPropellerTarget(b);
      if (t1) this.hitCell(t1, 'propeller');
      if (t2) this.hitCell(t2, 'propeller');
      // two extra
      for (let i = 0; i < 2; i++) {
        const t = this.pickPropellerTarget(mid);
        if (t) this.hitCell(t, 'propeller');
      }
    } else if (has('pearl') && (has('rocket') || has('bomb'))) {
      const other = (pa === 'pearl' ? pb : pa) as PowerKind;
      const color = pick(this.rng, this.colors);
      let n = 0;
      for (let r = 0; r < this.height && n < 12; r++) {
        for (let c = 0; c < this.width && n < 12; c++) {
          const cell = this.grid[r]![c]!;
          if (cell.gem === color && !cell.power) {
            cell.power = other.startsWith('rocket') ? other : other;
            n++;
          }
        }
      }
      for (let r = 0; r < this.height; r++) {
        for (let c = 0; c < this.width; c++) {
          const cell = this.grid[r]![c]!;
          if (cell.power === other) this.activatePower({ r, c }, other);
        }
      }
      return;
    } else if (pa === 'pearl' && pb === 'pearl') {
      for (let r = 0; r < this.height; r++) {
        for (let c = 0; c < this.width; c++) {
          const cell = this.grid[r]![c]!;
          if (cell.gem && !cell.power && cell.blocker !== 'crate') {
            this.hitCell({ r, c }, 'pearl');
          }
        }
      }
    } else {
      // Fallback: activate both
      this.runPowerEffect(a, pa);
      this.runPowerEffect(b, pb);
    }
    this.resolveBoard();
  }

  private applyGravityAndFill(): void {
    const falls: { from: Pos; to: Pos }[] = [];
    for (let c = 0; c < this.width; c++) {
      let write = this.height - 1;
      for (let r = this.height - 1; r >= 0; r--) {
        const cell = this.grid[r]![c]!;
        if (cell.blocker === 'crate' && cell.blockerLayers > 0) {
          write = r - 1;
          continue;
        }
        if (!cell.gem && !cell.power && !(cell.blocker === 'ice' && cell.blockerLayers > 0)) {
          continue;
        }
        // ice+gem falls together
        if (write !== r) {
          this.grid[write]![c] = cell;
          this.grid[r]![c] = emptyCell();
          falls.push({ from: { r, c }, to: { r: write, c } });
        }
        write--;
      }
      for (let r = write; r >= 0; r--) {
        if (this.grid[r]![c]!.blocker === 'crate' && this.grid[r]![c]!.blockerLayers > 0) continue;
        this.grid[r]![c] = gemCell(pick(this.rng, this.colors));
      }
    }
    if (falls.length) this.emit({ type: 'fall', moves: falls });
    const spawns: { pos: Pos; cell: Cell }[] = [];
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        // already filled; emit top fills roughly
        void spawns;
      }
    }
  }

  private shuffleBoard(): void {
    const positions: Pos[] = [];
    const gems: Cell[] = [];
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        const cell = this.grid[r]![c]!;
        if (cell.blocker === 'crate') continue;
        if (cell.blocker === 'ice') continue;
        if (cell.power) continue;
        if (!cell.gem) continue;
        positions.push({ r, c });
        gems.push(cloneCell(cell));
      }
    }
    shuffleInPlace(this.rng, gems);
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i]!;
      this.grid[p.r]![p.c] = gems[i]!;
    }
    // If still no moves / has match, reshuffle limited times
    for (let attempt = 0; attempt < 10; attempt++) {
      if (findMatches(this.grid).length === 0 && this.findHints().length > 0) break;
      shuffleInPlace(this.rng, gems);
      for (let i = 0; i < positions.length; i++) {
        const p = positions[i]!;
        this.grid[p.r]![p.c] = gems[i]!;
      }
    }
    this.emit({ type: 'shuffle' });
  }

  private swapCells(a: Pos, b: Pos): void {
    const tmp = this.grid[a.r]![a.c]!;
    this.grid[a.r]![a.c] = this.grid[b.r]![b.c]!;
    this.grid[b.r]![b.c] = tmp;
  }

  private inBounds(p: Pos): boolean {
    return p.r >= 0 && p.c >= 0 && p.r < this.height && p.c < this.width;
  }

  private buildInitial(level: LevelDef): Cell[][] {
    const grid: Cell[][] = [];
    for (let r = 0; r < this.height; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < this.width; c++) {
        row.push(gemCell(pick(this.rng, this.colors)));
      }
      grid.push(row);
    }
    if (!level.initialGrid?.length) return grid;

    const rows = level.initialGrid;
    if (rows.length === this.height) {
      for (let r = 0; r < this.height; r++) {
        const raw = rows[r]!;
        const parts = raw.includes(' ') ? raw.trim().split(/\s+/) : [...raw];
        for (let c = 0; c < this.width; c++) {
          grid[r]![c] = parseCellCode(parts[c] ?? 'M');
        }
      }
      return grid;
    }

    if (rows.length === this.width * this.height) {
      for (let i = 0; i < rows.length; i++) {
        const r = Math.floor(i / this.width);
        const c = i % this.width;
        grid[r]![c] = parseCellCode(rows[i]!);
      }
    }
    return grid;
  }

  private ensureNoInitialMatches(): void {
    for (let guard = 0; guard < 40; guard++) {
      const matches = findMatches(this.grid);
      if (!matches.length) return;
      for (const m of matches) {
        for (const p of m.cells) {
          const cell = this.grid[p.r]![p.c]!;
          if (cell.blocker || cell.power) continue;
          cell.gem = pick(this.rng, this.colors);
        }
      }
    }
  }
}

function normalizePower(p: PowerKind): 'rocket' | 'bomb' | 'pearl' | 'propeller' {
  if (p.startsWith('rocket')) return 'rocket';
  if (p === 'bomb') return 'bomb';
  if (p === 'pearl') return 'pearl';
  return 'propeller';
}

