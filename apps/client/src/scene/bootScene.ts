import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { DESIGN_HEIGHT, DESIGN_WIDTH, APP_VERSION } from '../config';
import type { VersionResponse } from '../api/health';

const TITLE_STYLE = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 54,
  fontWeight: '700',
  fill: '#fff8e7',
  dropShadow: {
    color: '#0a3d2e',
    blur: 4,
    distance: 3,
    alpha: 0.55,
  },
  align: 'center',
});

const SUB_STYLE = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 24,
  fill: '#d7ffe8',
  align: 'center',
  wordWrap: true,
  wordWrapWidth: 560,
});

const META_STYLE = new TextStyle({
  fontFamily: 'Trebuchet MS, Segoe UI, sans-serif',
  fontSize: 18,
  fill: '#a8e6c7',
  align: 'center',
});

/**
 * TEMP boot / island placeholder for E01.
 * Not a finished island map — proves Pixi canvas, 9:16 layout, and API wiring.
 */
export function createBootScene(
  app: Application,
  apiStatus: { ok: boolean; version?: VersionResponse; error?: string },
): Container {
  const root = new Container();

  const sky = new Graphics()
    .rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT)
    .fill({ color: 0x1aa6a6 });
  root.addChild(sky);

  // Gradient-ish bands (TEMP procedural background)
  const band = new Graphics()
    .rect(0, DESIGN_HEIGHT * 0.42, DESIGN_WIDTH, DESIGN_HEIGHT * 0.58)
    .fill({ color: 0x0d7a6f });
  root.addChild(band);

  const ocean = new Graphics()
    .ellipse(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.62, 380, 120)
    .fill({ color: 0x1ecbe1, alpha: 0.55 });
  root.addChild(ocean);

  const island = new Graphics()
    .ellipse(DESIGN_WIDTH / 2, DESIGN_HEIGHT * 0.58, 220, 90)
    .fill({ color: 0x3ecf7a });
  island.ellipse(DESIGN_WIDTH / 2 - 40, DESIGN_HEIGHT * 0.52, 70, 55).fill({ color: 0x2f9e5d });
  island.ellipse(DESIGN_WIDTH / 2 + 50, DESIGN_HEIGHT * 0.54, 55, 45).fill({ color: 0x47d98a });
  root.addChild(island);

  // TEMP palm
  const palm = new Graphics();
  palm.moveTo(DESIGN_WIDTH / 2 + 80, DESIGN_HEIGHT * 0.58);
  palm.lineTo(DESIGN_WIDTH / 2 + 95, DESIGN_HEIGHT * 0.42);
  palm.stroke({ width: 10, color: 0x8b5a2b });
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.35;
    palm
      .moveTo(DESIGN_WIDTH / 2 + 95, DESIGN_HEIGHT * 0.42)
      .lineTo(
        DESIGN_WIDTH / 2 + 95 + Math.cos(a) * 70,
        DESIGN_HEIGHT * 0.42 + Math.sin(a) * 40,
      )
      .stroke({ width: 8, color: 0x2fbf71 });
  }
  root.addChild(palm);

  const sun = new Graphics().circle(560, 180, 48).fill({ color: 0xffe066 });
  root.addChild(sun);

  const title = new Text({ text: 'Райский остров', style: TITLE_STYLE });
  title.anchor.set(0.5, 0);
  title.position.set(DESIGN_WIDTH / 2, 120);
  root.addChild(title);

  const subtitle = new Text({
    text: 'Match-3 PWA · фундамент E01\nTEMP-остров (не финальный арт)',
    style: SUB_STYLE,
  });
  subtitle.anchor.set(0.5, 0);
  subtitle.position.set(DESIGN_WIDTH / 2, 200);
  root.addChild(subtitle);

  const apiLine = apiStatus.ok
    ? `API: ${apiStatus.version?.service ?? 'ok'} ${apiStatus.version?.version ?? ''}`
    : `API: офлайн (${apiStatus.error ?? 'нет связи'})`;

  const meta = new Text({
    text: `клиент ${APP_VERSION}\n${apiLine}\nхолст ${DESIGN_WIDTH}×${DESIGN_HEIGHT} (9:16)`,
    style: META_STYLE,
  });
  meta.anchor.set(0.5, 1);
  meta.position.set(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 80);
  root.addChild(meta);

  // Soft bobbing for presence (2–3 intentional motions)
  let t = 0;
  app.ticker.add((ticker) => {
    t += ticker.deltaMS / 1000;
    island.y = Math.sin(t * 1.2) * 4;
    palm.rotation = Math.sin(t * 0.9) * 0.03;
    sun.scale.set(1 + Math.sin(t * 2) * 0.03);
  });

  return root;
}
