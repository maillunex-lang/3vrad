import { Application, Container, Graphics, Sprite, Text, TextStyle, Assets } from 'pixi.js';
import { clearLevel, ensureSession, type BuildingState, type Player } from '../api/session';
import { UI } from '../assets/catalog';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../config';
import { IslandMap } from '../island/IslandMap';
import { GameScreen } from '../match3/view/GameScreen';
import { beatForLevel } from '../story/milestones';
import { StoryOverlay } from '../story/StoryOverlay';

const LABEL = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 14,
  fill: '#e8fff2',
});

type Tab = 'island' | 'play' | 'shop' | 'team' | 'pvp';

/**
 * Main shell: island hub + match-3 + bottom nav (UI-003 B).
 */
export class AppShell {
  readonly root = new Container();
  private content = new Container();
  private nav = new Container();
  private overlayHost = new Container();
  private player!: Player;
  private buildings: BuildingState[] = [];
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
      // Replay-safe: do not auto-show past beats on boot.
      for (const b of [10, 20, 30, 40, 50, 60, 70]) {
        if (this.player.maxLevelCleared >= b) this.seenBeats.add(b);
      }
    } catch (e) {
      console.warn('session offline', e);
      this.player = {
        id: 'local',
        guestToken: '',
        displayName: 'Офлайн',
        coins: 0,
        diamonds: 0,
        buildStars: 0,
        maxLevelCleared: 0,
      };
      this.buildings = [];
    }
    await this.buildNav();
    await this.showTab('island');
  }

  private async buildNav(): Promise<void> {
    this.nav.removeChildren();
    const bar = new Graphics()
      .rect(0, DESIGN_HEIGHT - 100, DESIGN_WIDTH, 100)
      .fill({ color: 0x04261d, alpha: 0.96 });
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
      try {
        const tex = await Assets.load(t.icon);
        const spr = new Sprite(tex);
        spr.anchor.set(0.5);
        spr.position.set(x, DESIGN_HEIGHT - 62);
        spr.scale.set(0.55);
        spr.eventMode = 'static';
        spr.cursor = 'pointer';
        spr.on('pointertap', () => void this.showTab(t.id));
        this.nav.addChild(spr);
      } catch {
        const g = new Graphics().circle(x, DESIGN_HEIGHT - 62, 22).fill({ color: 0x0b6e4f });
        g.eventMode = 'static';
        g.on('pointertap', () => void this.showTab(t.id));
        this.nav.addChild(g);
      }
      const lab = new Text({ text: t.label, style: LABEL });
      lab.anchor.set(0.5, 0);
      lab.position.set(x, DESIGN_HEIGHT - 36);
      this.nav.addChild(lab);
    }
  }

  private async showTab(tab: Tab): Promise<void> {
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
      const campaignLevel = Math.min(70, this.player.maxLevelCleared + 1);
      this.game = new GameScreen(this.app, {
        campaignLevel,
        onWon: (info) => void this.handleWin(info.campaignLevel),
      });
      this.content.addChild(this.game.root);
      return;
    }
    const stub = new Graphics().rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT).fill({ color: 0x063a2c });
    this.content.addChild(stub);
    const msg = new Text({
      text:
        tab === 'shop'
          ? 'Магазин — скоро (E05)\nбез рекламы'
          : tab === 'team'
            ? 'Команды — после серверной готовности (E06)'
            : 'PvP — дуэли 3 мин (E06)\nSERVER-001 A: риск читов',
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

  private async handleWin(campaignLevel: number): Promise<void> {
    if (this.player.guestToken) {
      try {
        const idem = `clear:${this.player.id}:${campaignLevel}`;
        const res = await clearLevel(campaignLevel, 50, idem);
        this.player = {
          ...this.player,
          buildStars: res.buildStars,
          coins: res.coins,
          maxLevelCleared: res.maxLevelCleared,
        };
      } catch (e) {
        console.warn('clearLevel failed, applying local progress', e);
        this.applyLocalClear(campaignLevel);
      }
    } else {
      this.applyLocalClear(campaignLevel);
    }

    const beat = beatForLevel(campaignLevel);
    if (beat && !this.seenBeats.has(campaignLevel)) {
      this.seenBeats.add(campaignLevel);
      await this.showStory(beat);
    } else {
      await this.showTab('island');
    }
  }

  private applyLocalClear(level: number): void {
    const first = level > this.player.maxLevelCleared;
    this.player = {
      ...this.player,
      maxLevelCleared: Math.max(this.player.maxLevelCleared, level),
      buildStars: this.player.buildStars + (first && level <= 70 ? 1 : 0),
      coins: this.player.coins + 50,
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
