# ADR-002: Formalization of Match-3 rules (E02)

**Status:** Accepted (reversible where GDD leaves ambiguity)  
**Date:** 2026-11-21  
**Canon:** GDD-11, GDD-12 (APPROVED). Does not alter GDD-01–13.

## Context
GDD-12 leaves open: rocket orientation, propeller tie-breaks, multi-match resolution order, exact combo numeric effects, cascade score table.

## Decisions (temporary, documented)

### Gems
- Five colors: `mango`, `dragon`, `lime`, `passion`, `blue` (TEMP ids; art in E03).
- Board sizes: width/height independently in 6..9 (MATCH-001 C).

### Swap (MATCHCORE-001 C)
- Orthogonally adjacent cells only.
- Valid if: creates ≥1 match of 3+, OR both cells are powerups (combo swap), OR one is rainbow pearl (selects color of swapped partner).
- Invalid swap animates back; does not consume a move.

### Match detection
- Lines ≥3 horizontal/vertical.
- Special creation priority on a match group (highest wins):  
  1. Rainbow (exactly 5 in a straight line, or longer line → still pearl)  
  2. Bomb (T or L shape, ≥5 cells in the group)  
  3. Rocket (exactly 4 in a straight line)  
  4. Propeller (2×2 square of same color)  
- If multiple specials could form, prefer higher priority; then larger group; then topmost then leftmost center.

### Rocket orientation
- Horizontal line match → rocket clears **row**.
- Vertical line match → rocket clears **column**.
- Stored as `rocket_h` / `rocket_v`.

### Power activations (GDD-12)
- Rocket: clear entire row or column.
- Bomb: 3×3 centered on cell (POWER-001 A).
- Pearl: clear all normal gems of selected color (via swap partner color, or random if activated without swap).
- Propeller: fly to priority target (POWER-002 B):  
  1) blocker/goal object with remaining HP  
  2) else normal gem  
  Tie-break: higher goal priority weight, then Manhattan nearest, then topmost, then leftmost.

### Combos (proposed table, numeric effects reversible)
- Rocket+Rocket: clear row and column through both cells (cross at first).
- Rocket+Bomb: clear 3 rows and 3 columns centered on bomb.
- Bomb+Bomb: 5×5 blast centered on midpoint.
- Propeller+Rocket/Bomb: deliver that powerup to propeller target, then activate.
- Propeller+Propeller: spawn two additional propellers at random valid targets.
- Pearl+Rocket/Bomb: convert all gems of selected color into that powerup, then activate them left-to-right top-to-bottom (cap 12 activations).
- Pearl+Pearl: clear all normal gems on board.

### Cascades (CASCADE-001 C, CASCADE-002 A)
- Gravity: downward; empty cells fill from above; new gems from seeded RNG bag.
- Score: base 10 per gem cleared × cascade multiplier; multiplier starts at 1 and +1 each cascade step after the first, **capped at 8**.
- Cascades grant **score/VFX only** — no currency, no free powerups (CASCADE-002 A).
- Safety: max **64** resolve steps per player move; if exceeded, stop resolve, shuffle board once, log `cascade_guard`.

### Blockers (initial subset for E02)
- `crate` layers 1–3: occupies cell; damaged by adjacent match or powerup hit; not swappable.
- `ice` layers 1–3: covers a gem; gem cannot swap until ice gone; ice damaged by adjacent match/power hit.
- Other blocker types deferred to content milestones.

### Goals / moves / fail-help
- Goals: collect color counts, score threshold, destroy N blocker layers.
- Moves decrement only on successful swap (including powerup swap).
- Win when all goals met (even mid-cascade after move).
- Lose when moves = 0 and goals unmet after resolve.
- Fail streak per level: after 3 losses, offer choice of 2 starting powerups once until clear (HELP-002 B).
- No lives, no ads.

### Determinism
- Level JSON provides `seed`, optional `initialGrid`.
- RNG: mulberry32 from seed.

## Consequences
- Engine is pure TS, unit-tested; Pixi is a view.
- Ambiguous numeric combo effects can be tuned without GDD change; document diffs here.
