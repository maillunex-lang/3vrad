import { Assets, Container, Graphics, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { blockerPath, gemPath, powerPath } from '../../assets/catalog';
import type { Match3Engine } from '../engine';
import type { EngineEvent, Cell, Pos } from '../types';
import { BOARD_BG, CELL_BG, GEM_FILL, GEM_STROKE, POWER_LABEL } from './colors';

const TITLE = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 28,
  fill: '#fff6d8',
  fontWeight: '700',
});

const HUD = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 20,
  fill: '#e8fff2',
});

const SMALL = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 16,
  fill: '#b8f0d0',
});

export type BoardViewOpts = {
  originX: number;
  originY: number;
  maxWidth: number;
  maxHeight: number;
};

/**
 * Pixi view with a short FX playback queue so sync engine cascades still feel stepped.
 */
export class BoardView {
  readonly root = new Container();
  private boardLayer = new Container();
  private fxLayer = new Container();
  private hudText: Text;
  private goalText: Text;
  private statusText: Text;
  private cellSize = 64;
  private pad = 4;
  private selected: Pos | null = null;
  private gemNodes = new Map<string, Container>();
  private helpContainer: Container | null = null;
  private queue: EngineEvent[] = [];
  private playing = false;
  private unsub: (() => void) | null = null;

  constructor(
    private engine: Match3Engine,
    private opts: BoardViewOpts,
  ) {
    this.root.addChild(this.boardLayer);
    this.root.addChild(this.fxLayer);

    this.hudText = new Text({ text: '', style: HUD });
    this.goalText = new Text({ text: '', style: SMALL });
    this.statusText = new Text({ text: '', style: TITLE });
    this.root.addChild(this.hudText);
    this.root.addChild(this.goalText);
    this.root.addChild(this.statusText);

    this.layoutMetrics();
    this.drawStaticBoard();
    this.syncFromEngine();
    this.bindInput();
    this.attachEngine(engine);
  }

  setEngine(engine: Match3Engine): void {
    this.engine = engine;
    this.selected = null;
    this.queue = [];
    this.playing = false;
    this.layoutMetrics();
    this.drawStaticBoard();
    this.syncFromEngine();
    this.attachEngine(engine);
  }

  private attachEngine(engine: Match3Engine): void {
    this.unsub?.();
    this.unsub = engine.on((ev) => {
      if (ev.type === 'hint') {
        this.flashHints(ev.moves);
        return;
      }
      if (ev.type === 'help_offer') {
        this.showHelp(ev.options);
        return;
      }
      this.queue.push(ev);
      void this.pump();
    });
  }

  private async pump(): Promise<void> {
    if (this.playing) return;
    this.playing = true;
    while (this.queue.length) {
      const ev = this.queue.shift()!;
      await this.play(ev);
    }
    this.playing = false;
  }

  private play(ev: EngineEvent): Promise<void> {
    switch (ev.type) {
      case 'swap':
      case 'swap_revert':
        return this.animateSwap(ev.a, ev.b);
      case 'clear':
        // Engine already finished resolve; bursts mark cleared cells, board rebuilds on resolve_end.
        this.burst(ev.cells.map((c) => c.pos));
        return wait(70);
      case 'fall':
        // Intermediate fall poses are not snapshotted by sync engine; full rebuild on resolve_end.
        return wait(50);
      case 'resolve_end':
      case 'shuffle':
      case 'status':
        this.syncFromEngine();
        return wait(40);
      case 'power_created':
        return Promise.resolve();
      default:
        return Promise.resolve();
    }
  }

  private layoutMetrics(): void {
    const snap = this.engine.snapshot();
    const cols = snap.width;
    const rows = snap.height;
    const sizeW = (this.opts.maxWidth - 16) / cols;
    const sizeH = (this.opts.maxHeight - 160) / rows;
    this.cellSize = Math.floor(Math.min(sizeW, sizeH, 78));
    this.boardLayer.position.set(this.opts.originX, this.opts.originY + 110);
    this.hudText.position.set(this.opts.originX, this.opts.originY + 16);
    this.goalText.position.set(this.opts.originX, this.opts.originY + 48);
    this.statusText.position.set(this.opts.originX, this.opts.originY + 78);
  }

  private drawStaticBoard(): void {
    this.boardLayer.removeChildren();
    this.gemNodes.clear();
    const snap = this.engine.snapshot();
    const bg = new Graphics()
      .roundRect(
        -8,
        -8,
        snap.width * this.cellSize + 16,
        snap.height * this.cellSize + 16,
        16,
      )
      .fill({ color: BOARD_BG });
    this.boardLayer.addChild(bg);

    for (let r = 0; r < snap.height; r++) {
      for (let c = 0; c < snap.width; c++) {
        const x = c * this.cellSize;
        const y = r * this.cellSize;
        const slot = new Graphics()
          .roundRect(x + this.pad, y + this.pad, this.cellSize - this.pad * 2, this.cellSize - this.pad * 2, 12)
          .fill({ color: CELL_BG, alpha: 0.85 });
        this.boardLayer.addChild(slot);
      }
    }
  }

  private syncFromEngine(): void {
    for (const node of this.gemNodes.values()) node.destroy();
    this.gemNodes.clear();

    const snap = this.engine.snapshot();
    for (let r = 0; r < snap.height; r++) {
      for (let c = 0; c < snap.width; c++) {
        const cell = snap.grid[r]![c]!;
        const node = this.makeGemNode(cell, r, c);
        if (node) {
          this.boardLayer.addChild(node);
          this.gemNodes.set(`${r},${c}`, node);
        }
      }
    }

    if (this.selected) {
      const n = this.gemNodes.get(`${this.selected.r},${this.selected.c}`);
      if (n) n.scale.set(1.08);
    }

    this.hudText.text = `${snap.levelId} · ходы ${snap.movesLeft} · очки ${snap.score}`;
    this.goalText.text = snap.goals
      .map((g) => {
        if (g.kind === 'collect_color') return `${g.color}: ${g.remaining}`;
        if (g.kind === 'score') return `очки: ${g.remaining}`;
        return `${g.blocker}: ${g.remaining}`;
      })
      .join(' · ');

    if (snap.status === 'won') this.statusText.text = 'Победа!';
    else if (snap.status === 'lost') this.statusText.text = 'Ходы закончились';
    else this.statusText.text = '';
  }

  private makeGemNode(cell: Cell, r: number, c: number): Container | null {
    if (!cell.gem && !cell.power && !(cell.blocker === 'crate' && cell.blockerLayers > 0)) {
      return null;
    }
    const node = new Container();
    const x = c * this.cellSize + this.cellSize / 2;
    const y = r * this.cellSize + this.cellSize / 2;
    node.position.set(x, y);

    const radius = (this.cellSize - this.pad * 2) / 2 - 2;

    if (cell.blocker === 'crate') {
      const tex = tryTexture(blockerPath('crate'));
      if (tex) {
        const spr = new Sprite(tex);
        spr.anchor.set(0.5);
        spr.width = radius * 2;
        spr.height = radius * 2;
        node.addChild(spr);
      } else {
        const g = new Graphics()
          .roundRect(-radius, -radius, radius * 2, radius * 2, 6)
          .fill({ color: 0x8b5a2b })
          .stroke({ width: 2, color: 0x5c3a1a });
        node.addChild(g);
      }
      const t = new Text({
        text: String(cell.blockerLayers),
        style: new TextStyle({ fontSize: 18, fill: '#fff', fontWeight: '700' }),
      });
      t.anchor.set(0.5);
      node.addChild(t);
      return node;
    }

    if (cell.gem) {
      const tex = tryTexture(gemPath(cell.gem));
      if (tex) {
        const spr = new Sprite(tex);
        spr.anchor.set(0.5);
        const side = radius * 2;
        spr.width = side;
        spr.height = side;
        node.addChild(spr);
      } else {
        const g = new Graphics()
          .circle(0, 0, radius)
          .fill({ color: GEM_FILL[cell.gem] })
          .stroke({ width: 3, color: GEM_STROKE[cell.gem] });
        g.ellipse(-radius * 0.25, -radius * 0.3, radius * 0.35, radius * 0.2).fill({
          color: 0xffffff,
          alpha: 0.35,
        });
        node.addChild(g);
      }
    }

    if (cell.blocker === 'ice' && cell.blockerLayers > 0) {
      const itex = tryTexture(blockerPath('ice'));
      if (itex) {
        const spr = new Sprite(itex);
        spr.anchor.set(0.5);
        spr.width = radius * 2.05;
        spr.height = radius * 2.05;
        spr.alpha = 0.85;
        node.addChild(spr);
      } else {
        const ice = new Graphics()
          .roundRect(-radius, -radius, radius * 2, radius * 2, 8)
          .fill({ color: 0xa0e9ff, alpha: 0.45 })
          .stroke({ width: 2, color: 0xe0f7ff, alpha: 0.8 });
        node.addChild(ice);
      }
      const t = new Text({
        text: `I${cell.blockerLayers}`,
        style: new TextStyle({ fontSize: 14, fill: '#eafcff' }),
      });
      t.anchor.set(0.5);
      t.position.set(0, radius * 0.55);
      node.addChild(t);
    }

    if (cell.power) {
      const ptex = tryTexture(powerPath(cell.power));
      if (ptex) {
        const spr = new Sprite(ptex);
        spr.anchor.set(0.5);
        spr.width = radius * 1.6;
        spr.height = radius * 1.6;
        node.addChild(spr);
      } else {
        const ring = new Graphics().circle(0, 0, radius + 2).stroke({ width: 3, color: 0xfff1a8 });
        node.addChild(ring);
        const t = new Text({
          text: POWER_LABEL[cell.power],
          style: new TextStyle({ fontSize: 22, fill: '#fffef2', fontWeight: '700' }),
        });
        t.anchor.set(0.5);
        node.addChild(t);
      }
    }

    node.eventMode = 'static';
    node.cursor = 'pointer';
    return node;
  }

  private bindInput(): void {
    this.boardLayer.eventMode = 'static';
    this.boardLayer.on('pointertap', (e) => {
      if (this.playing || this.queue.length) return;
      const local = this.boardLayer.toLocal(e.global);
      const c = Math.floor(local.x / this.cellSize);
      const r = Math.floor(local.y / this.cellSize);
      if (r < 0 || c < 0 || r >= this.engine.height || c >= this.engine.width) return;
      this.onCellTap({ r, c });
    });
  }

  private onCellTap(pos: Pos): void {
    if (this.engine.snapshot().status !== 'playing') return;
    const cell = this.engine.cellAt(pos.r, pos.c);
    if (!this.selected) {
      this.selected = pos;
      this.syncFromEngine();
      return;
    }
    if (this.selected.r === pos.r && this.selected.c === pos.c) {
      if (cell?.power) this.engine.activateCellPower(pos);
      this.selected = null;
      return;
    }
    const adj =
      Math.abs(this.selected.r - pos.r) + Math.abs(this.selected.c - pos.c) === 1;
    if (adj) {
      this.engine.trySwap(this.selected, pos);
      this.selected = null;
      return;
    }
    this.selected = pos;
    this.syncFromEngine();
  }

  private cellCenter(pos: Pos): { x: number; y: number } {
    return {
      x: pos.c * this.cellSize + this.cellSize / 2,
      y: pos.r * this.cellSize + this.cellSize / 2,
    };
  }

  private animateSwap(a: Pos, b: Pos): Promise<void> {
    const na = this.gemNodes.get(`${a.r},${a.c}`);
    const nb = this.gemNodes.get(`${b.r},${b.c}`);
    if (!na || !nb) return Promise.resolve();
    const ca = this.cellCenter(a);
    const cb = this.cellCenter(b);
    return tween(140, (e) => {
      na.position.set(ca.x + (cb.x - ca.x) * e, ca.y + (cb.y - ca.y) * e);
      nb.position.set(cb.x + (ca.x - cb.x) * e, cb.y + (ca.y - cb.y) * e);
    });
  }

  private burst(positions: Pos[]): void {
    for (const p of positions) {
      const g = new Graphics()
        .circle(
          this.boardLayer.x + p.c * this.cellSize + this.cellSize / 2,
          this.boardLayer.y + p.r * this.cellSize + this.cellSize / 2,
          8,
        )
        .fill({ color: 0xfff3b0, alpha: 0.9 });
      this.fxLayer.addChild(g);
      void tween(280, (t) => {
        g.scale.set(1 + t * 2.2);
        g.alpha = Math.max(0, 1 - t);
      }).then(() => g.destroy());
      this.sparkleAt(p);
    }
  }

  private flashHints(moves: [Pos, Pos][]): void {
    for (const [a] of moves.slice(0, 3)) {
      const g = new Graphics()
        .roundRect(
          this.boardLayer.x + a.c * this.cellSize + 4,
          this.boardLayer.y + a.r * this.cellSize + 4,
          this.cellSize - 8,
          this.cellSize - 8,
          10,
        )
        .stroke({ width: 3, color: 0xfff56a });
      this.fxLayer.addChild(g);
      setTimeout(() => g.destroy(), 700);
    }
  }

  /** Extra sparkle burst on clears (MATCH-002 B / UI-005 C — TEMP particles). */
  private sparkleAt(pos: Pos, color = 0xffe066): void {
    const { x, y } = this.cellCenter(pos);
    for (let i = 0; i < 6; i++) {
      const ang = (Math.PI * 2 * i) / 6;
      const dot = new Graphics().circle(0, 0, 4).fill({ color });
      dot.position.set(this.boardLayer.x + x, this.boardLayer.y + y);
      this.fxLayer.addChild(dot);
      void tween(320, (t) => {
        dot.position.set(
          this.boardLayer.x + x + Math.cos(ang) * 28 * t,
          this.boardLayer.y + y + Math.sin(ang) * 28 * t,
        );
        dot.alpha = Math.max(0, 1 - t);
      }).then(() => dot.destroy());
    }
  }

  private showHelp(options: string[]): void {
    if (this.helpContainer) this.helpContainer.destroy();
    const box = new Container();
    const bg = new Graphics()
      .roundRect(40, 400, 640, 160, 16)
      .fill({ color: 0x04281f, alpha: 0.95 })
      .stroke({ width: 2, color: 0x7dffb3 });
    box.addChild(bg);
    const label = new Text({
      text: '3 поражения. Выберите стартовый усилитель (1 раз):',
      style: SMALL,
    });
    label.position.set(60, 420);
    box.addChild(label);
    options.forEach((opt, i) => {
      const btn = new Graphics()
        .roundRect(60 + i * 200, 470, 180, 56, 12)
        .fill({ color: 0x0b6e4f });
      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      const t = new Text({ text: opt, style: HUD });
      t.position.set(80 + i * 200, 485);
      btn.on('pointertap', () => {
        this.engine.applyStartingPower(opt as never);
        box.destroy();
        this.helpContainer = null;
        this.syncFromEngine();
      });
      box.addChild(btn);
      box.addChild(t);
    });
    this.root.addChild(box);
    this.helpContainer = box;
  }
}

function tryTexture(url: string): Texture | null {
  try {
    if (Assets.cache.has(url)) return Assets.get(url);
  } catch {
    /* ignore */
  }
  return null;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tween(durationMs: number, onUpdate: (t01: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      onUpdate(t * (2 - t));
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}
