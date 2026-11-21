import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../config';
import type { StoryBeat } from './milestones';

const TITLE = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 32,
  fill: '#fff8e7',
  fontWeight: '700',
  wordWrap: true,
  wordWrapWidth: 520,
  align: 'center',
});
const SPEAKER = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 20,
  fill: '#7dffb2',
  fontWeight: '700',
});
const BODY = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 22,
  fill: '#e8fff2',
  wordWrap: true,
  wordWrapWidth: 500,
  align: 'center',
  lineHeight: 30,
});
const BTN = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 20,
  fill: '#04261d',
  fontWeight: '700',
});

/**
 * Full-screen story beat overlay (DIALOG-001 B). TEMP copy until CHAR scripts land.
 */
export class StoryOverlay {
  readonly root = new Container();

  constructor(beat: StoryBeat, onClose: () => void) {
    const dim = new Graphics()
      .rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT)
      .fill({ color: 0x021912, alpha: 0.82 });
    dim.eventMode = 'static';
    this.root.addChild(dim);

    const panel = new Graphics()
      .roundRect(60, DESIGN_HEIGHT / 2 - 220, DESIGN_WIDTH - 120, 400, 24)
      .fill({ color: 0x0b3d2e })
      .stroke({ width: 3, color: 0x7dffb2, alpha: 0.55 });
    this.root.addChild(panel);

    const title = new Text({ text: beat.title, style: TITLE });
    title.anchor.set(0.5, 0);
    title.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 - 190);
    this.root.addChild(title);

    const speaker = new Text({ text: beat.speaker, style: SPEAKER });
    speaker.anchor.set(0.5, 0);
    speaker.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 - 120);
    this.root.addChild(speaker);

    const body = new Text({ text: beat.lines.join('\n\n'), style: BODY });
    body.anchor.set(0.5, 0);
    body.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 - 80);
    this.root.addChild(body);

    const btn = new Graphics()
      .roundRect(DESIGN_WIDTH / 2 - 110, DESIGN_HEIGHT / 2 + 120, 220, 52, 14)
      .fill({ color: 0xb8f0d0 });
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointertap', onClose);
    this.root.addChild(btn);
    const btnLabel = new Text({ text: 'Дальше', style: BTN });
    btnLabel.anchor.set(0.5);
    btnLabel.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 + 146);
    this.root.addChild(btnLabel);
  }
}
