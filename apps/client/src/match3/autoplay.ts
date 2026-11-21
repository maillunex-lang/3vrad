import { Match3Engine } from './engine';
import type { LevelDef, Pos } from './types';

/** Greedy autoplay using hints; deterministic given level seed + engine RNG only for fills. */
export function autoplayLevel(
  level: LevelDef,
  opts?: { maxMoves?: number; script?: [Pos, Pos][] },
): { won: boolean; movesUsed: number; score: number; status: string } {
  const engine = new Match3Engine(level);
  let movesUsed = 0;

  if (opts?.script) {
    for (const [a, b] of opts.script) {
      if (engine.snapshot().status !== 'playing') break;
      if (engine.trySwap(a, b)) movesUsed++;
    }
    const s = engine.snapshot();
    return { won: s.status === 'won', movesUsed, score: s.score, status: s.status };
  }

  const limit = opts?.maxMoves ?? level.moves;
  while (movesUsed < limit && engine.snapshot().status === 'playing') {
    const hints = engine.findHints();
    if (!hints.length) break;
    // Prefer first hint (stable order from board scan)
    const [a, b] = hints[0]!;
    if (!engine.trySwap(a, b)) {
      // try next
      let done = false;
      for (let i = 1; i < hints.length; i++) {
        const [x, y] = hints[i]!;
        if (engine.trySwap(x, y)) {
          movesUsed++;
          done = true;
          break;
        }
      }
      if (!done) break;
    } else {
      movesUsed++;
    }
  }
  const s = engine.snapshot();
  return { won: s.status === 'won', movesUsed, score: s.score, status: s.status };
}
