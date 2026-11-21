import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../../config';
import { Match3Engine } from '../engine';
import { campaignLevel, type CampaignLevel } from '../levels/campaignDraft';
import { VERIFY_LEVELS } from '../levels/verifyLevels';
import type { LevelDef, PowerKind } from '../types';
import { BoardView } from './BoardView';

const BTN = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 18,
  fill: '#f4fff8',
  fontWeight: '700',
});
const META = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 16,
  fill: '#b8f0d0',
});

export type GameScreenOptions = {
  campaignLevel?: number;
  startingPower?: PowerKind | null;
  onWon?: (info: { campaignLevel: number; coinsBase: number; verifyId: string }) => void;
};

/**
 * Playable Match-3: campaign DRAFT levels (1–100) with verify pack as debug fallback.
 */
export class GameScreen {
  readonly root = new Container();
  private engine: Match3Engine;
  private board: BoardView;
  private levelIndex = 0;
  private failStreak = 0;
  private helpUsed = false;
  private campaignLevelNo: number;
  private winReported = false;
  private metaText: Text;
  private mode: 'campaign' | 'verify' = 'campaign';

  constructor(_app: Application, private opts: GameScreenOptions = {}) {
    this.campaignLevelNo = Math.max(1, Math.min(100, opts.campaignLevel ?? 1));
    const bg = new Graphics()
      .rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT)
      .fill({ color: 0x04261d });
    bg.rect(0, 0, DESIGN_WIDTH, 220).fill({ color: 0x0b6e4f, alpha: 0.35 });
    this.root.addChild(bg);

    const level = this.resolveLevel();
    this.engine = this.makeEngine(level);
    if (opts.startingPower) {
      this.engine.placeBooster(opts.startingPower);
    }
    this.board = new BoardView(this.engine, {
      originX: 24,
      originY: 40,
      maxWidth: DESIGN_WIDTH - 48,
      maxHeight: DESIGN_HEIGHT - 200,
    });
    this.root.addChild(this.board.root);

    this.metaText = new Text({ text: '', style: META });
    this.metaText.position.set(24, DESIGN_HEIGHT - 198);
    this.root.addChild(this.metaText);
    this.updateMeta();
    this.buildToolbar();
  }

  private resolveLevel(): LevelDef {
    if (this.mode === 'campaign') {
      const c = campaignLevel(this.campaignLevelNo);
      if (c) return c;
    }
    return VERIFY_LEVELS[this.levelIndex]!;
  }

  private currentCampaign(): CampaignLevel | undefined {
    return this.mode === 'campaign' ? campaignLevel(this.campaignLevelNo) : undefined;
  }

  private updateMeta(): void {
    const c = this.currentCampaign();
    if (c) {
      this.metaText.text = `Ур.${c.meta.levelNo} · ${c.meta.island} гл.${c.meta.chapter} · ${c.meta.difficulty} · DRAFT`;
    } else {
      this.metaText.text = `Verify ${VERIFY_LEVELS[this.levelIndex]?.id ?? '?'}`;
    }
  }

  private makeEngine(level: LevelDef): Match3Engine {
    return new Match3Engine(level, {
      failStreak: this.failStreak,
      helpUsed: this.helpUsed,
    });
  }

  private buildToolbar(): void {
    const bar = new Container();
    // Keep toolbar above the 100px bottom nav so taps do not collide.
    bar.position.set(24, DESIGN_HEIGHT - 168);

    const mkBtn = (label: string, x: number, fn: () => void) => {
      const g = new Graphics().roundRect(x, 0, 150, 48, 12).fill({ color: 0x0b6e4f });
      g.eventMode = 'static';
      g.cursor = 'pointer';
      g.on('pointertap', fn);
      const t = new Text({ text: label, style: BTN });
      t.position.set(x + 12, 12);
      bar.addChild(g);
      bar.addChild(t);
    };

    mkBtn('Подсказка', 0, () => this.engine.requestHints());
    mkBtn('Заново', 160, () => this.restart());
    mkBtn('Сл. ур.', 320, () => this.nextLevel());
    mkBtn('Verify', 480, () => {
      this.mode = this.mode === 'campaign' ? 'verify' : 'campaign';
      this.restart();
    });

    this.root.addChild(bar);
    this.wireStatus();
  }

  private restart(): void {
    const level = this.resolveLevel();
    this.helpUsed = this.engine.snapshot().helpUsed;
    this.failStreak = this.engine.snapshot().failStreak;
    this.winReported = false;
    this.engine = this.makeEngine(level);
    if (this.opts.startingPower && this.mode === 'campaign') {
      this.engine.placeBooster(this.opts.startingPower);
    }
    this.root.removeChild(this.board.root);
    this.board = new BoardView(this.engine, {
      originX: 24,
      originY: 40,
      maxWidth: DESIGN_WIDTH - 48,
      maxHeight: DESIGN_HEIGHT - 200,
    });
    this.root.addChildAt(this.board.root, 1);
    this.updateMeta();
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
          const c = this.currentCampaign();
          this.opts.onWon?.({
            campaignLevel: c?.meta.levelNo ?? this.campaignLevelNo,
            coinsBase: c?.meta.coinsBase ?? 50,
            verifyId: this.engine.levelId,
          });
        }
      }
    });
  }

  private nextLevel(): void {
    if (this.mode === 'campaign') {
      this.campaignLevelNo = Math.min(100, this.campaignLevelNo + 1);
    } else {
      this.levelIndex = (this.levelIndex + 1) % VERIFY_LEVELS.length;
    }
    this.failStreak = 0;
    this.helpUsed = false;
    this.restart();
  }
}
