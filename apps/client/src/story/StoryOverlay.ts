import { Assets, Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';
import { portraitForSpeaker } from '../assets/catalog';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../config';
import type { StoryBeat } from './milestones';

const TITLE = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 32,
  fill: '#fff8e7',
  fontWeight: '700',
  wordWrap: true,
  wordWrapWidth: 420,
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
  wordWrapWidth: 420,
  align: 'left',
  lineHeight: 30,
});
const BTN = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 20,
  fill: '#04261d',
  fontWeight: '700',
});
const NOTE = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 12,
  fill: '#8ab89a',
});

/**
 * Full-screen story beat overlay (DIALOG-001 B). TEMP copy + TEMP portraits.
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
      .roundRect(40, DESIGN_HEIGHT / 2 - 260, DESIGN_WIDTH - 80, 480, 24)
      .fill({ color: 0x0b3d2e })
      .stroke({ width: 3, color: 0x7dffb2, alpha: 0.55 });
    this.root.addChild(panel);

    const title = new Text({ text: beat.title, style: TITLE });
    title.anchor.set(0.5, 0);
    title.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 - 235);
    this.root.addChild(title);

    const portraitUrl = portraitForSpeaker(beat.speaker);
    const textLeft = portraitUrl ? 220 : DESIGN_WIDTH / 2;
    if (portraitUrl) {
      void Assets.load(portraitUrl)
        .then((tex) => {
          const spr = new Sprite(tex);
          spr.anchor.set(0.5);
          spr.position.set(140, DESIGN_HEIGHT / 2 - 20);
          spr.width = 160;
          spr.height = 160;
          this.root.addChild(spr);
        })
        .catch(() => {
          /* portrait optional */
        });
      const tag = new Text({ text: 'TEMP портрет', style: NOTE });
      tag.position.set(70, DESIGN_HEIGHT / 2 + 70);
      this.root.addChild(tag);
    }

    const speaker = new Text({ text: beat.speaker, style: SPEAKER });
    speaker.position.set(textLeft - (portraitUrl ? 0 : 100), DESIGN_HEIGHT / 2 - 160);
    this.root.addChild(speaker);

    const body = new Text({ text: beat.lines.join('\n\n'), style: BODY });
    body.position.set(textLeft - (portraitUrl ? 0 : 210), DESIGN_HEIGHT / 2 - 120);
    this.root.addChild(body);

    const btn = new Graphics()
      .roundRect(DESIGN_WIDTH / 2 - 110, DESIGN_HEIGHT / 2 + 140, 220, 52, 14)
      .fill({ color: 0xb8f0d0 });
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointertap', onClose);
    this.root.addChild(btn);
    const btnLabel = new Text({ text: 'Дальше', style: BTN });
    btnLabel.anchor.set(0.5);
    btnLabel.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2 + 166);
    this.root.addChild(btnLabel);
  }
}
