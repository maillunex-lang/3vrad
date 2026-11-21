import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import {
  buyShopItem,
  fetchShopCatalog,
  type InventoryItem,
  type Player,
  type ShopItem,
} from '../api/session';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../config';

const TITLE = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 36,
  fill: '#fff8e7',
  fontWeight: '700',
});
const BODY = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 18,
  fill: '#e8fff2',
  wordWrap: true,
  wordWrapWidth: 520,
});
const SMALL = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 16,
  fill: '#b8f0d0',
});

/**
 * Booster shop (ECON-002 C). Coin/diamond spend only — no ads, no real payments.
 */
export class ShopScreen {
  readonly root = new Container();
  private list = new Container();

  constructor(
    private player: Player,
    private inventory: InventoryItem[],
    private onPlayer: (p: Player, inv: InventoryItem[]) => void,
  ) {
    const bg = new Graphics().rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT).fill({ color: 0x063a2c });
    this.root.addChild(bg);
    const title = new Text({ text: 'Магазин', style: TITLE });
    title.position.set(40, 40);
    this.root.addChild(title);
    const bal = new Text({
      text: `🪙 ${player.coins}   💎 ${player.diamonds}\nБез рекламы · цены черновые`,
      style: SMALL,
    });
    bal.position.set(40, 90);
    this.root.addChild(bal);
    this.root.addChild(this.list);
    void this.load();
  }

  private async load(): Promise<void> {
    this.list.removeChildren();
    let items: ShopItem[] = [];
    try {
      const cat = await fetchShopCatalog();
      items = cat.items;
      const note = new Text({ text: cat.note, style: SMALL });
      note.position.set(40, 140);
      this.list.addChild(note);
    } catch (e) {
      const err = new Text({ text: `Офлайн: ${String(e)}`, style: BODY });
      err.position.set(40, 160);
      this.list.addChild(err);
      return;
    }

    const invMap = new Map(this.inventory.map((i) => [i.itemId, i.qty]));
    items.forEach((it, idx) => {
      const y = 190 + idx * 100;
      const card = new Graphics()
        .roundRect(32, y, DESIGN_WIDTH - 64, 88, 14)
        .fill({ color: 0x0b3d2e, alpha: 0.95 });
      this.list.addChild(card);
      const owned = invMap.get(it.id) ?? 0;
      const label = new Text({
        text: `${it.name} — ${it.price}${it.currency === 'coins' ? '🪙' : '💎'}${owned ? ` · есть ${owned}` : ''}\n${it.description}`,
        style: BODY,
      });
      label.position.set(48, y + 12);
      this.list.addChild(label);
      const btn = new Graphics()
        .roundRect(DESIGN_WIDTH - 200, y + 20, 140, 48, 12)
        .fill({ color: 0x0b6e4f });
      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.on('pointertap', () => void this.buy(it));
      const bt = new Text({ text: 'Купить', style: SMALL });
      bt.position.set(DESIGN_WIDTH - 168, y + 34);
      this.list.addChild(btn);
      this.list.addChild(bt);
    });
  }

  private async buy(it: ShopItem): Promise<void> {
    try {
      const idem = `buy:${this.player.id}:${it.id}:${Date.now()}`;
      const res = await buyShopItem(it.id, idem);
      this.player = { ...this.player, coins: res.coins, diamonds: res.diamonds };
      this.inventory = res.inventory;
      this.onPlayer(this.player, this.inventory);
      await this.load();
    } catch (e) {
      console.warn('buy failed', e);
    }
  }
}
