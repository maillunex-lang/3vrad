import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../../config';
import { Match3Engine } from '../engine';
import { VERIFY_LEVELS } from '../levels/verifyLevels';
import type { LevelDef } from '../types';
import { BoardView } from './BoardView';

const BTN = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 18,
  fill: '#f4fff8',
  fontWeight: '700',
});

export type GameScreenOptions = {
  /** Campaign level to report on win (1–70). Board uses verify pack as proxy until LEVELS-001. */
  campaignLevel?: number;
  onWon?: (info: { campaignLevel: number; verifyId: string }) => void;
};

/**
 * Playable Match-3 shell for E02: level picker + board + debug controls.
 */
export class GameScreen {
  readonly root = new Container();
  private engine: Match3Engine;
  private board: BoardView;
  private levelIndex = 0;
  private failStreak = 0;
  private helpUsed = false;
  private campaignLevel: number;
  private winReported = false;

  constructor(_app: Application, private opts: GameScreenOptions = {}) {
    this.campaignLevel = Math.max(1, Math.min(70, opts.campaignLevel ?? 1));
    const bg = new Graphics()
      .rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT)
      .fill({ color: 0x04261d });
    // soft bands
    bg.rect(0, 0, DESIGN_WIDTH, 220).fill({ color: 0x0b6e4f, alpha: 0.35 });
    this.root.addChild(bg);

    this.engine = this.makeEngine(VERIFY_LEVELS[0]!);
    this.board = new BoardView(this.engine, {
      originX: 24,
      originY: 20,
      maxWidth: DESIGN_WIDTH - 48,
      maxHeight: DESIGN_HEIGHT - 160,
    });
    this.root.addChild(this.board.root);
    this.buildToolbar();
  }

  private makeEngine(level: LevelDef): Match3Engine {
    return new Match3Engine(level, {
      failStreak: this.failStreak,
      helpUsed: this.helpUsed,
    });
  }

  private buildToolbar(): void {
    const bar = new Container();
    bar.position.set(24, DESIGN_HEIGHT - 120);

    const mkBtn = (label: string, x: number, fn: () => void) => {
      const g = new Graphics().roundRect(x, 0, 150, 48, 12).fill({ color: 0x0b6e4f });
      g.eventMode = 'static';
      g.cursor = 'pointer';
      g.on('pointertap', fn);
      const t = new Text({ text: label, style: BTN });
      t.position.set(x + 16, 12);
      bar.addChild(g);
      bar.addChild(t);
    };

    mkBtn('Подсказка', 0, () => this.engine.requestHints());
    mkBtn('Заново', 170, () => this.restart());
    mkBtn('Сл. ур.', 340, () => this.nextLevel());
    mkBtn('Пред. ур.', 510, () => this.prevLevel());

    this.root.addChild(bar);

    this.wireStatus();
  }

  private restart(): void {
    const level = VERIFY_LEVELS[this.levelIndex]!;
    this.helpUsed = this.engine.snapshot().helpUsed;
    this.failStreak = this.engine.snapshot().failStreak;
    this.winReported = false;
    this.engine = this.makeEngine(level);
    this.root.removeChild(this.board.root);
    this.board = new BoardView(this.engine, {
      originX: 24,
      originY: 20,
      maxWidth: DESIGN_WIDTH - 48,
      maxHeight: DESIGN_HEIGHT - 160,
    });
    this.root.addChildAt(this.board.root, 1);
    this.wireStatus();
  }

  private wireStatus(): void {
    this.engine.on((ev) => {
      if (ev.type === 'status' && ev.status === 'lost') {
        this.failStreak = this.engine.snapshot().failStreak;
      }
      if (ev.type === 'status' && ev.status === 'won') {
        this.failStreak = 0;
        this.helpUsed = false;
        if (!this.winReported) {
          this.winReported = true;
          const verifyId = VERIFY_LEVELS[this.levelIndex]?.id ?? 'v01';
          this.opts.onWon?.({ campaignLevel: this.campaignLevel, verifyId });
        }
      }
    });
  }

  private nextLevel(): void {
    this.levelIndex = (this.levelIndex + 1) % VERIFY_LEVELS.length;
    this.failStreak = 0;
    this.helpUsed = false;
    this.restart();
  }

  private prevLevel(): void {
    this.levelIndex = (this.levelIndex - 1 + VERIFY_LEVELS.length) % VERIFY_LEVELS.length;
    this.failStreak = 0;
    this.helpUsed = false;
    this.restart();
  }
}
