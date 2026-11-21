import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Match3Engine } from '../engine';
import type { Cell, Pos } from '../types';
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

    engine.on((ev) => {
      if (ev.type === 'status' || ev.type === 'clear' || ev.type === 'swap' || ev.type === 'swap_revert' || ev.type === 'shuffle' || ev.type === 'power_created' || ev.type === 'fall') {
        this.syncFromEngine();
      }
      if (ev.type === 'clear') this.burst(ev.cells.map((c) => c.pos));
      if (ev.type === 'help_offer') this.showHelp(ev.options);
      if (ev.type === 'hint') this.flashHints(ev.moves);
    });
  }

  setEngine(engine: Match3Engine): void {
    this.engine = engine;
    this.selected = null;
    this.layoutMetrics();
    this.drawStaticBoard();
    this.syncFromEngine();
    engine.on((ev) => {
      if (ev.type === 'clear') this.burst(ev.cells.map((c) => c.pos));
      if (ev.type === 'help_offer') this.showHelp(ev.options);
      this.syncFromEngine();
    });
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
    // Remove old gem nodes
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
      const g = new Graphics()
        .roundRect(-radius, -radius, radius * 2, radius * 2, 6)
        .fill({ color: 0x8b5a2b })
        .stroke({ width: 2, color: 0x5c3a1a });
      node.addChild(g);
      const t = new Text({
        text: String(cell.blockerLayers),
        style: new TextStyle({ fontSize: 18, fill: '#fff', fontWeight: '700' }),
      });
      t.anchor.set(0.5);
      node.addChild(t);
      return node;
    }

    if (cell.gem) {
      const g = new Graphics()
        .circle(0, 0, radius)
        .fill({ color: GEM_FILL[cell.gem] })
        .stroke({ width: 3, color: GEM_STROKE[cell.gem] });
      // gloss
      g.ellipse(-radius * 0.25, -radius * 0.3, radius * 0.35, radius * 0.2).fill({
        color: 0xffffff,
        alpha: 0.35,
      });
      node.addChild(g);
    }

    if (cell.blocker === 'ice' && cell.blockerLayers > 0) {
      const ice = new Graphics()
        .roundRect(-radius, -radius, radius * 2, radius * 2, 8)
        .fill({ color: 0xa0e9ff, alpha: 0.45 })
        .stroke({ width: 2, color: 0xe0f7ff, alpha: 0.8 });
      node.addChild(ice);
      const t = new Text({
        text: `❄${cell.blockerLayers}`,
        style: new TextStyle({ fontSize: 14, fill: '#eafcff' }),
      });
      t.anchor.set(0.5);
      t.position.set(0, radius * 0.55);
      node.addChild(t);
    }

    if (cell.power) {
      const ring = new Graphics().circle(0, 0, radius + 2).stroke({ width: 3, color: 0xfff1a8 });
      node.addChild(ring);
      const t = new Text({
        text: POWER_LABEL[cell.power],
        style: new TextStyle({ fontSize: 22, fill: '#fffef2', fontWeight: '700' }),
      });
      t.anchor.set(0.5);
      node.addChild(t);
    }

    node.eventMode = 'static';
    node.cursor = 'pointer';
    return node;
  }

  private bindInput(): void {
    this.boardLayer.eventMode = 'static';
    this.boardLayer.on('pointertap', (e) => {
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
      if (cell?.power && !cell.blocker) {
        // second tap pattern: select first
        this.selected = pos;
        this.syncFromEngine();
        return;
      }
      this.selected = pos;
      this.syncFromEngine();
      return;
    }
    if (this.selected.r === pos.r && this.selected.c === pos.c) {
      // activate power on double-select
      if (cell?.power) this.engine.activateCellPower(pos);
      this.selected = null;
      this.syncFromEngine();
      return;
    }
    const adj =
      Math.abs(this.selected.r - pos.r) + Math.abs(this.selected.c - pos.c) === 1;
    if (adj) {
      this.engine.trySwap(this.selected, pos);
      this.selected = null;
      this.syncFromEngine();
      return;
    }
    this.selected = pos;
    this.syncFromEngine();
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
      let t = 0;
      const tick = () => {
        t += 0.08;
        g.scale.set(1 + t * 2);
        g.alpha = Math.max(0, 1 - t);
        if (t >= 1) {
          g.destroy();
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
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
