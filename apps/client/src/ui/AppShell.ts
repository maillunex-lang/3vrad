import { Application, Container, Graphics, Sprite, Text, TextStyle, Assets } from 'pixi.js';
import {
  clearLevel,
  ensureSession,
  useInventoryItem,
  type BuildingState,
  type InventoryItem,
  type Player,
} from '../api/session';
import { UI } from '../assets/catalog';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../config';
import { IslandMap } from '../island/IslandMap';
import { campaignLevel } from '../match3/levels/campaignDraft';
import type { PowerKind } from '../match3/types';
import { GameScreen } from '../match3/view/GameScreen';
import { beatForLevel } from '../story/milestones';
import { StoryOverlay } from '../story/StoryOverlay';
import { ShopScreen } from './ShopScreen';
import { TeamScreen } from './TeamScreen';

const LABEL = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 14,
  fill: '#e8fff2',
});

type Tab = 'island' | 'play' | 'shop' | 'team' | 'pvp';

const BOOSTER_MAP: Record<string, PowerKind> = {
  booster_rocket: 'rocket_h',
  booster_bomb: 'bomb',
  booster_propeller: 'propeller',
  booster_pearl: 'pearl',
};

/**
 * Main shell: island hub + match-3 campaign + shop + teams + bottom nav.
 */
export class AppShell {
  readonly root = new Container();
  private content = new Container();
  private nav = new Container();
  private overlayHost = new Container();
  private player!: Player;
  private buildings: BuildingState[] = [];
  private inventory: InventoryItem[] = [];
  private island: IslandMap | null = null;
  private game: GameScreen | null = null;
  private seenBeats = new Set<number>();

  constructor(private app: Application) {
    this.root.addChild(this.content);
    this.root.addChild(this.nav);
    this.root.addChild(this.overlayHost);
    void this.boot();
    this.app.ticker.add((t) => {
      this.island?.tick(t.deltaMS);
    });
  }

  private async boot(): Promise<void> {
    try {
      const session = await ensureSession();
      this.player = session.player;
      this.buildings = session.buildings;
      this.inventory = session.inventory ?? [];
      for (const b of [10, 20, 30, 40, 50, 60, 70]) {
        if (this.player.maxLevelCleared >= b) this.seenBeats.add(b);
      }
    } catch (e) {
      console.warn('session offline', e);
      this.player = {
        id: 'local',
        guestToken: '',
        displayName: 'Офлайн',
        coins: 300,
        diamonds: 5,
        buildStars: 0,
        maxLevelCleared: 0,
      };
      this.buildings = [];
      this.inventory = [];
    }
    await this.buildNav();
    const fromHash = this.tabFromHash();
    await this.showTab(fromHash ?? 'island', !fromHash);
  }

  private activeTab: Tab = 'island';
  private hashBound = false;

  private async buildNav(): Promise<void> {
    this.nav.removeChildren();
    const bar = new Graphics()
      .rect(0, DESIGN_HEIGHT - 100, DESIGN_WIDTH, 100)
      .fill({ color: 0x04261d, alpha: 0.96 });
    // Capture all taps in the nav strip so content underneath cannot steal them.
    bar.eventMode = 'static';
    this.nav.addChild(bar);

    const tabs: { id: Tab; icon: string; label: string }[] = [
      { id: 'island', icon: UI.navIsland, label: 'Остров' },
      { id: 'play', icon: UI.navPlay, label: 'Игра' },
      { id: 'shop', icon: UI.navShop, label: 'Магазин' },
      { id: 'team', icon: UI.navTeam, label: 'Команда' },
      { id: 'pvp', icon: UI.navPvp, label: 'PvP' },
    ];
    const slot = DESIGN_WIDTH / tabs.length;
    for (let i = 0; i < tabs.length; i++) {
      const t = tabs[i]!;
      const x = slot * i + slot / 2;
      const hit = new Graphics()
        .rect(slot * i, DESIGN_HEIGHT - 100, slot, 100)
        .fill({ color: this.activeTab === t.id ? 0x0b6e4f : 0x000000, alpha: this.activeTab === t.id ? 0.35 : 0.001 });
      hit.eventMode = 'static';
      hit.cursor = 'pointer';
      hit.on('pointertap', () => void this.showTab(t.id));
      this.nav.addChild(hit);
      try {
        const tex = await Assets.load(t.icon);
        const spr = new Sprite(tex);
        spr.anchor.set(0.5);
        spr.position.set(x, DESIGN_HEIGHT - 62);
        spr.scale.set(0.55);
        spr.eventMode = 'none';
        this.nav.addChild(spr);
      } catch {
        const g = new Graphics().circle(x, DESIGN_HEIGHT - 62, 22).fill({ color: 0x0b6e4f });
        g.eventMode = 'none';
        this.nav.addChild(g);
      }
      const lab = new Text({ text: t.label, style: LABEL });
      lab.anchor.set(0.5, 0);
      lab.position.set(x, DESIGN_HEIGHT - 36);
      lab.eventMode = 'none';
      this.nav.addChild(lab);
    }
    if (!this.hashBound) {
      this.hashBound = true;
      window.addEventListener('hashchange', () => {
        const tab = this.tabFromHash();
        if (tab && tab !== this.activeTab) void this.showTab(tab, false);
      });
    }
  }

  private tabFromHash(): Tab | null {
    const h = (location.hash || '').replace(/^#\/?/, '');
    if (h === 'island' || h === 'play' || h === 'shop' || h === 'team' || h === 'pvp') return h;
    return null;
  }

  private async showTab(tab: Tab, pushHash = true): Promise<void> {
    this.activeTab = tab;
    if (pushHash) location.hash = `#/${tab}`;
    await this.buildNav();
    this.content.removeChildren();
    this.island = null;
    this.game = null;

    if (tab === 'island') {
      this.island = new IslandMap(this.player, this.buildings, {
        onPlayLevel: () => void this.showTab('play'),
      });
      this.content.addChild(this.island.root);
      return;
    }
    if (tab === 'play') {
      const campaignLevelNo = Math.min(100, Math.max(1, this.player.maxLevelCleared + 1));
      const startingPower = await this.consumeOptionalBooster();
      this.game = new GameScreen(this.app, {
        campaignLevel: campaignLevelNo,
        startingPower,
        onWon: (info) => void this.handleWin(info.campaignLevel, info.coinsBase),
      });
      this.content.addChild(this.game.root);
      return;
    }
    if (tab === 'shop') {
      const shop = new ShopScreen(this.player, this.inventory, (p, inv) => {
        this.player = p;
        this.inventory = inv;
      });
      this.content.addChild(shop.root);
      return;
    }
    if (tab === 'team') {
      this.content.addChild(new TeamScreen(this.player).root);
      return;
    }
    const stub = new Graphics().rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT).fill({ color: 0x063a2c });
    this.content.addChild(stub);
    const msg = new Text({
      text: 'PvP — дуэли 3 мин (E06)\nSERVER-001 A: риск читов\nбез платных преимуществ в рейтинге',
      style: new TextStyle({
        fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
        fontSize: 28,
        fill: '#e8fff2',
        align: 'center',
      }),
    });
    msg.anchor.set(0.5);
    msg.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
    this.content.addChild(msg);
  }

  /** Auto-use first available booster from inventory when starting a level. */
  private async consumeOptionalBooster(): Promise<PowerKind | null> {
    for (const [itemId, power] of Object.entries(BOOSTER_MAP)) {
      const row = this.inventory.find((i) => i.itemId === itemId && i.qty > 0);
      if (!row) continue;
      if (!this.player.guestToken) {
        row.qty -= 1;
        return power;
      }
      try {
        const idem = `use:${this.player.id}:${itemId}:${this.player.maxLevelCleared + 1}`;
        const res = await useInventoryItem(itemId, idem);
        this.inventory = res.inventory;
        this.player = { ...this.player, coins: res.coins, diamonds: res.diamonds };
        return power;
      } catch (e) {
        console.warn('booster use failed', e);
      }
    }
    return null;
  }

  private async handleWin(campaignLevelNo: number, coinsBase: number): Promise<void> {
    const draft = campaignLevel(campaignLevelNo);
    const coins = draft?.meta.coinsBase ?? coinsBase;
    if (this.player.guestToken) {
      try {
        const idem = `clear:${this.player.id}:${campaignLevelNo}`;
        const res = await clearLevel(campaignLevelNo, coins, idem);
        this.player = {
          ...this.player,
          buildStars: res.buildStars,
          coins: res.coins,
          maxLevelCleared: res.maxLevelCleared,
        };
      } catch (e) {
        console.warn('clearLevel failed, applying local progress', e);
        this.applyLocalClear(campaignLevelNo, coins);
      }
    } else {
      this.applyLocalClear(campaignLevelNo, coins);
    }

    const beat = beatForLevel(campaignLevelNo);
    if (beat && !this.seenBeats.has(campaignLevelNo)) {
      this.seenBeats.add(campaignLevelNo);
      await this.showStory(beat);
    } else {
      await this.showTab('island');
    }
  }

  private applyLocalClear(level: number, coins: number): void {
    const first = level > this.player.maxLevelCleared;
    this.player = {
      ...this.player,
      maxLevelCleared: Math.max(this.player.maxLevelCleared, level),
      buildStars: this.player.buildStars + (first && level <= 70 ? 1 : 0),
      coins: this.player.coins + (first ? coins : 0),
    };
  }

  private showStory(beat: NonNullable<ReturnType<typeof beatForLevel>>): Promise<void> {
    return new Promise((resolve) => {
      this.overlayHost.removeChildren();
      const overlay = new StoryOverlay(beat, () => {
        this.overlayHost.removeChildren();
        void this.showTab('island').then(() => resolve());
      });
      this.overlayHost.addChild(overlay.root);
    });
  }
}
