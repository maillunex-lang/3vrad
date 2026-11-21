import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { createTeam, fetchTeam, joinTeam, type Player, type TeamInfo } from '../api/session';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../config';

const TITLE = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 36,
  fill: '#fff8e7',
  fontWeight: '700',
});
const BODY = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 20,
  fill: '#e8fff2',
  wordWrap: true,
  wordWrapWidth: 600,
});
const SMALL = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 16,
  fill: '#b8f0d0',
});

/**
 * Teams scaffold (ONLINE-002 B / TEAM-001 C): create/join up to 30. No chat yet.
 */
export class TeamScreen {
  readonly root = new Container();
  private body = new Container();

  constructor(private player: Player) {
    const bg = new Graphics().rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT).fill({ color: 0x063a2c });
    this.root.addChild(bg);
    const title = new Text({ text: 'Команда', style: TITLE });
    title.position.set(40, 40);
    this.root.addChild(title);
    this.root.addChild(this.body);
    void this.refresh();
  }

  private async refresh(): Promise<void> {
    this.body.removeChildren();
    try {
      const res = await fetchTeam();
      if (res.team) {
        this.renderTeam(res.team, res.members ?? []);
        return;
      }
    } catch (e) {
      const err = new Text({ text: `Сервер недоступен: ${String(e)}`, style: BODY });
      err.position.set(40, 120);
      this.body.addChild(err);
    }
    this.renderCreateJoin();
  }

  private renderTeam(
    team: TeamInfo,
    members: { playerId: string; displayName: string; role: string }[],
  ): void {
    const info = new Text({
      text: `${team.name}\nКод: ${team.code}\nУчастники: ${team.members}/30`,
      style: BODY,
    });
    info.position.set(40, 120);
    this.body.addChild(info);
    members.forEach((m, i) => {
      const row = new Text({
        text: `• ${m.displayName} (${m.role})`,
        style: SMALL,
      });
      row.position.set(48, 260 + i * 28);
      this.body.addChild(row);
    });
    const note = new Text({
      text: 'Задания и общий остров — следующие итерации E06.',
      style: SMALL,
    });
    note.position.set(40, DESIGN_HEIGHT - 160);
    this.body.addChild(note);
  }

  private renderCreateJoin(): void {
    const hint = new Text({
      text: 'Создай команду или вступи по коду.\nЛимит 30 игроков.',
      style: BODY,
    });
    hint.position.set(40, 120);
    this.body.addChild(hint);

    const mk = (label: string, y: number, fn: () => void) => {
      const btn = new Graphics().roundRect(40, y, 280, 56, 14).fill({ color: 0x0b6e4f });
      btn.eventMode = 'static';
      btn.cursor = 'pointer';
      btn.on('pointertap', fn);
      const t = new Text({ text: label, style: BODY });
      t.position.set(60, y + 14);
      this.body.addChild(btn);
      this.body.addChild(t);
    };

    mk('Создать «Островники»', 280, () => void this.doCreate());
    mk('Вступить (буфер кода)', 360, () => void this.doJoin());
  }

  private async doCreate(): Promise<void> {
    try {
      await createTeam(`Остров ${this.player.displayName}`);
      await this.refresh();
    } catch (e) {
      console.warn(e);
    }
  }

  private async doJoin(): Promise<void> {
    try {
      const code = (await navigator.clipboard.readText()).trim();
      if (!code) return;
      await joinTeam(code);
      await this.refresh();
    } catch (e) {
      // Fallback: prompt via hardcoded empty — use last known from localStorage demo
      const code = window.prompt('Код команды');
      if (!code) return;
      try {
        await joinTeam(code);
        await this.refresh();
      } catch (err) {
        console.warn(err);
      }
    }
  }
}
