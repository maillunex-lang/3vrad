import { Assets, Container, Graphics, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { buildingSpritePath, UI, ZONE_BG } from '../assets/catalog';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../config';
import type { BuildingState, Player } from '../api/session';
import { advanceBuilding, setBuildingStyle } from '../api/session';
import { STYLE_UNLOCK } from '../story/milestones';
import { BUILDINGS, ZONES, type BuildingDef } from './catalog';

const TITLE = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 28,
  fill: '#fff8e7',
  fontWeight: '700',
});
const BODY = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 18,
  fill: '#e8fff2',
  wordWrap: true,
  wordWrapWidth: 420,
});
const SMALL = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 16,
  fill: '#b8f0d0',
});

export type IslandMapCallbacks = {
  onPlayLevel?: () => void;
  onBuildingChanged?: (building: BuildingState, buildStars?: number) => void;
};

/**
 * Fixed-camera isometric zone map (GDD-15 MAP-002 A).
 * Buildings are separate sprites (not baked into a mega-background).
 */
export class IslandMap {
  readonly root = new Container();
  private zoneIndex = 0;
  private world = new Container();
  private hud = new Container();
  private card = new Container();
  private player: Player;
  private states: Map<string, BuildingState>;
  private selected: BuildingDef | null = null;
  private animT = 0;

  constructor(player: Player, buildings: BuildingState[], private cb: IslandMapCallbacks = {}) {
    this.player = player;
    this.states = new Map(buildings.map((b) => [b.buildingId, b]));
    this.root.addChild(this.world);
    this.root.addChild(this.hud);
    this.root.addChild(this.card);
    void this.rebuild();
  }

  updatePlayer(player: Player, buildings: BuildingState[]): void {
    this.player = player;
    this.states = new Map(buildings.map((b) => [b.buildingId, b]));
    void this.rebuild();
  }

  tick(deltaMS: number): void {
    this.animT += deltaMS / 1000;
    // Minimal map animation (ART-003 A): gentle palm/water bob on props tagged
    for (const child of this.world.children) {
      if (child.label === 'water') {
        child.alpha = 0.85 + Math.sin(this.animT * 1.5) * 0.08;
      }
      if (child.label === 'palm') {
        child.rotation = Math.sin(this.animT * 1.2) * 0.03;
      }
    }
  }

  private zoneUnlocked(zoneId: string): boolean {
    const z = ZONES.find((x) => x.id === zoneId);
    if (!z) return false;
    return this.player.maxLevelCleared >= z.unlockLevel || zoneId === 'Z1';
  }

  private async rebuild(): Promise<void> {
    this.world.removeChildren();
    this.hud.removeChildren();
    this.card.removeChildren();

    const zone = ZONES[this.zoneIndex]!;
    const unlocked = this.zoneUnlocked(zone.id);

    const bgTex = await this.loadTex(ZONE_BG[zone.id]!);
    const bg = new Sprite(bgTex);
    bg.width = DESIGN_WIDTH;
    bg.height = DESIGN_HEIGHT - 140;
    bg.y = 70;
    this.world.addChild(bg);

    // water shimmer band
    const water = new Graphics()
      .ellipse(DESIGN_WIDTH * 0.7, DESIGN_HEIGHT * 0.72, 220, 48)
      .fill({ color: 0x1ecbe1, alpha: 0.25 });
    water.label = 'water';
    this.world.addChild(water);

    if (!unlocked) {
      const silTex = await this.loadTex(UI.silhouette);
      const sil = new Sprite(silTex);
      sil.anchor.set(0.5);
      sil.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.45);
      sil.scale.set(1.6);
      sil.alpha = 0.85;
      this.world.addChild(sil);
      const lock = new Text({
        text: `${zone.name}\nоткроется позже`,
        style: TITLE,
      });
      lock.anchor.set(0.5);
      lock.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.62);
      this.world.addChild(lock);
    } else {
      const zoneBuildings = BUILDINGS.filter((b) => b.zone === zone.id);
      // sort by y for painter's algorithm (south/higher y draws later)
      zoneBuildings.sort((a, b) => a.y - b.y);
      for (const b of zoneBuildings) {
        await this.placeBuilding(b);
      }
      // decorative palms (minimal animation)
      for (const [x, y] of [
        [80, 520],
        [620, 560],
        [120, 780],
      ] as const) {
        const palm = new Graphics();
        palm.moveTo(x, y);
        palm.lineTo(x + 6, y - 70);
        palm.stroke({ width: 8, color: 0x8b5a2b });
        for (let i = -2; i <= 2; i++) {
          palm
            .moveTo(x + 6, y - 70)
            .lineTo(x + 6 + i * 22, y - 95)
            .stroke({ width: 6, color: 0x2fbf71 });
        }
        palm.label = 'palm';
        palm.pivot.set(x + 6, y);
        palm.position.set(x + 6, y);
        this.world.addChild(palm);
      }
    }

    this.buildHud(zone.name, unlocked);
    if (this.selected) this.showCard(this.selected);
  }

  private async placeBuilding(def: BuildingDef): Promise<void> {
    const st = this.states.get(def.id) ?? { buildingId: def.id, stage: 0, style: 'tropical' as const };
    const path = buildingSpritePath(def.id, st.stage, st.style);
    const tex = await this.loadTex(path);
    const spr = new Sprite(tex);
    spr.anchor.set(0.5, 0.92);
    // map conceptual 0–100 coords into zone screen
    const x = 40 + (def.x / 100) * (DESIGN_WIDTH - 80);
    const y = 160 + ((def.y - 5) / 95) * (DESIGN_HEIGHT - 360);
    spr.position.set(x, y);
    spr.scale.set(def.id === 'B01' ? 0.42 : 0.34);
    spr.eventMode = 'static';
    spr.cursor = 'pointer';
    spr.on('pointertap', () => {
      this.selected = def;
      void this.rebuild();
    });
    this.world.addChild(spr);

    const label = new Text({ text: def.id, style: SMALL });
    label.anchor.set(0.5, 0);
    label.position.set(x, y + 8);
    this.world.addChild(label);
  }

  private buildHud(zoneName: string, unlocked: boolean): void {
    const top = new Graphics().rect(0, 0, DESIGN_WIDTH, 70).fill({ color: 0x04281f, alpha: 0.88 });
    this.hud.addChild(top);

    const title = new Text({ text: `Остров · ${zoneName}`, style: TITLE });
    title.position.set(20, 16);
    this.hud.addChild(title);

    const currencies = new Text({
      text: `★ ${this.player.buildStars}   🪙 ${this.player.coins}   ур.${this.player.maxLevelCleared}`,
      style: SMALL,
    });
    currencies.position.set(20, 48);
    this.hud.addChild(currencies);

    const navY = DESIGN_HEIGHT - 168;
    const mk = (label: string, x: number, fn: () => void) => {
      const g = new Graphics().roundRect(x, navY, 150, 44, 12).fill({ color: 0x0b6e4f });
      g.eventMode = 'static';
      g.cursor = 'pointer';
      g.on('pointertap', fn);
      const t = new Text({ text: label, style: SMALL });
      t.position.set(x + 16, navY + 12);
      this.hud.addChild(g);
      this.hud.addChild(t);
    };
    mk('◀ Зона', 20, () => {
      this.zoneIndex = (this.zoneIndex - 1 + ZONES.length) % ZONES.length;
      this.selected = null;
      void this.rebuild();
    });
    mk('Зона ▶', 190, () => {
      this.zoneIndex = (this.zoneIndex + 1) % ZONES.length;
      this.selected = null;
      void this.rebuild();
    });
    mk('К заданию', 360, () => {
      const target = this.nextBuildTarget();
      if (target) {
        this.zoneIndex = ZONES.findIndex((z) => z.id === target.zone);
        this.selected = target;
        void this.rebuild();
      }
    });
    mk('Играть', 530, () => this.cb.onPlayLevel?.());

    const dots = new Text({
      text: ZONES.map((z, i) => (i === this.zoneIndex ? '●' : unlocked || this.zoneUnlocked(z.id) ? '○' : '·')).join(' '),
      style: SMALL,
    });
    dots.position.set(24, navY + 48);
    this.hud.addChild(dots);
    void unlocked;
  }

  private nextBuildTarget(): BuildingDef | null {
    for (const b of BUILDINGS) {
      const st = this.states.get(b.id)?.stage ?? 0;
      if (st < b.stages.length) return b;
    }
    return BUILDINGS[0] ?? null;
  }

  private showCard(def: BuildingDef): void {
    const st = this.states.get(def.id) ?? { buildingId: def.id, stage: 0, style: 'tropical' as const };
    const nextIdx = st.stage;
    const next = def.stages[nextIdx];
    const panel = new Graphics()
      .roundRect(40, 360, DESIGN_WIDTH - 80, 280, 18)
      .fill({ color: 0x063528, alpha: 0.96 })
      .stroke({ width: 2, color: 0x7dffb3 });
    this.card.addChild(panel);

    const title = new Text({ text: def.name, style: TITLE });
    title.position.set(60, 380);
    this.card.addChild(title);

    const body = new Text({
      text: next
        ? `Состояние: этап ${st.stage}/${def.stages.length}\nСледующий этап: ур.${next.unlockLevel}, ★${next.costStars}\nСтиль: ${st.style}`
        : `Постройка завершена\nСтиль: ${st.style}`,
      style: BODY,
    });
    body.position.set(60, 420);
    this.card.addChild(body);

    if (next) {
      const can =
        this.player.maxLevelCleared >= next.unlockLevel && this.player.buildStars >= next.costStars;
      const btn = new Graphics()
        .roundRect(60, 540, 240, 56, 14)
        .fill({ color: can ? 0x0b6e4f : 0x44554c });
      btn.eventMode = 'static';
      btn.cursor = can ? 'pointer' : 'default';
      const t = new Text({ text: can ? `Построить (−★${next.costStars})` : 'Недоступно', style: SMALL });
      t.position.set(80, 556);
      if (can) {
        btn.on('pointertap', () => void this.doBuild(def));
      }
      this.card.addChild(btn);
      this.card.addChild(t);
    } else {
      const styles: Array<'tropical' | 'luxury' | 'fantasy'> = ['tropical', 'luxury', 'fantasy'];
      styles.forEach((s, i) => {
        const unlocked =
          s === 'tropical' ||
          (s === 'luxury' && this.player.maxLevelCleared >= STYLE_UNLOCK.luxury) ||
          (s === 'fantasy' && this.player.maxLevelCleared >= STYLE_UNLOCK.fantasy);
        const btn = new Graphics()
          .roundRect(60 + i * 180, 540, 160, 48, 12)
          .fill({ color: !unlocked ? 0x44554c : st.style === s ? 0x1aa6a6 : 0x0b6e4f });
        btn.eventMode = 'static';
        btn.cursor = unlocked ? 'pointer' : 'default';
        if (unlocked) btn.on('pointertap', () => void this.doStyle(def, s));
        const t = new Text({
          text: unlocked ? s : `${s} 🔒`,
          style: SMALL,
        });
        t.position.set(80 + i * 180, 554);
        this.card.addChild(btn);
        this.card.addChild(t);
      });
    }

    const close = new Graphics().roundRect(DESIGN_WIDTH - 140, 380, 60, 40, 10).fill({ color: 0x8b3a3a });
    close.eventMode = 'static';
    close.cursor = 'pointer';
    close.on('pointertap', () => {
      this.selected = null;
      void this.rebuild();
    });
    const cx = new Text({ text: '✕', style: SMALL });
    cx.position.set(DESIGN_WIDTH - 118, 388);
    this.card.addChild(close);
    this.card.addChild(cx);
  }

  private async doBuild(def: BuildingDef): Promise<void> {
    const idem = `build:${def.id}:stage:${(this.states.get(def.id)?.stage ?? 0) + 1}`;
    try {
      const res = await advanceBuilding(def.id, idem);
      this.player = { ...this.player, buildStars: res.buildStars };
      const building: BuildingState = {
        buildingId: def.id,
        stage: res.stage,
        style: (res.style as BuildingState['style']) || 'tropical',
      };
      this.states.set(def.id, building);
      this.cb.onBuildingChanged?.(building, res.buildStars);
      // brief VFX
      const burst = new Graphics().circle(DESIGN_WIDTH / 2, 500, 10).fill({ color: 0xffe066 });
      this.card.addChild(burst);
      await this.rebuild();
    } catch (e) {
      console.error(e);
    }
  }

  private async doStyle(def: BuildingDef, style: 'tropical' | 'luxury' | 'fantasy'): Promise<void> {
    try {
      const res = await setBuildingStyle(def.id, style);
      this.states.set(def.id, res);
      this.cb.onBuildingChanged?.(res);
      await this.rebuild();
    } catch (e) {
      console.error(e);
    }
  }

  private texCache = new Map<string, Texture>();
  private async loadTex(url: string): Promise<Texture> {
    const hit = this.texCache.get(url);
    if (hit) return hit;
    const tex = await Assets.load(url);
    this.texCache.set(url, tex);
    return tex;
  }
}
