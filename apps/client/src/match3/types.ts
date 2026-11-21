export type GemColor = 'mango' | 'dragon' | 'lime' | 'passion' | 'blue';

export type PowerKind =
  | 'rocket_h'
  | 'rocket_v'
  | 'bomb'
  | 'pearl'
  | 'propeller';

export type BlockerKind = 'crate' | 'ice';

export const GEM_COLORS: GemColor[] = ['mango', 'dragon', 'lime', 'passion', 'blue'];

export type Cell = {
  gem: GemColor | null;
  power: PowerKind | null;
  /** Ice covers gem; crates occupy without gem. */
  blocker: BlockerKind | null;
  blockerLayers: number;
};

export type Pos = { r: number; c: number };

export type GoalKind = 'collect_color' | 'score' | 'break_blocker';

export type GoalDef =
  | { kind: 'collect_color'; color: GemColor; count: number }
  | { kind: 'score'; count: number }
  | { kind: 'break_blocker'; blocker: BlockerKind; count: number };

export type GoalProgress = GoalDef & { remaining: number };

export type LevelDef = {
  id: string;
  width: number;
  height: number;
  moves: number;
  seed: number;
  goals: GoalDef[];
  /** Row-major; null = generate; string codes documented in parseGrid. */
  initialGrid?: string[];
  colors?: GemColor[];
};

export type GameStatus = 'playing' | 'won' | 'lost';

export type ClearEvent = {
  pos: Pos;
  gem: GemColor | null;
  power: PowerKind | null;
  fromPower?: PowerKind | string;
};

export type EngineEvent =
  | { type: 'swap'; a: Pos; b: Pos }
  | { type: 'swap_revert'; a: Pos; b: Pos }
  | { type: 'clear'; cells: ClearEvent[]; cascadeStep: number; scoreDelta: number }
  | { type: 'spawn'; cells: { pos: Pos; cell: Cell }[] }
  | { type: 'fall'; moves: { from: Pos; to: Pos }[] }
  | { type: 'power_created'; pos: Pos; power: PowerKind; color: GemColor }
  | { type: 'shuffle' }
  | { type: 'status'; status: GameStatus }
  | { type: 'hint'; moves: [Pos, Pos][] }
  | { type: 'help_offer'; options: PowerKind[] }
  | { type: 'resolve_end' };

export type EngineSnapshot = {
  width: number;
  height: number;
  grid: Cell[][];
  movesLeft: number;
  score: number;
  cascadeMultiplier: number;
  goals: GoalProgress[];
  status: GameStatus;
  failStreak: number;
  helpUsed: boolean;
  levelId: string;
};
