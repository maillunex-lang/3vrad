import { Application } from 'pixi.js';
import { fetchApiVersion } from './api/health';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './config';
import { computeViewport } from './layout/viewport';
import { GameScreen } from './match3/view/GameScreen';

const appRoot = document.getElementById('app');
const statusEl = document.getElementById('status');

function setStatus(text: string): void {
  if (statusEl) statusEl.textContent = text;
}

async function boot(): Promise<void> {
  if (!appRoot) throw new Error('#app missing');

  const pixi = new Application();
  await pixi.init({
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    backgroundColor: 0x04261d,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });

  appRoot.appendChild(pixi.canvas);
  applyViewport(pixi);
  window.addEventListener('resize', () => applyViewport(pixi));
  window.addEventListener('orientationchange', () => applyViewport(pixi));

  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 4000);
    const version = await fetchApiVersion(controller.signal);
    window.clearTimeout(timer);
    setStatus(`API ${version.version} · Match-3 E02`);
  } catch (err) {
    setStatus(`API офлайн · Match-3 локально (${err instanceof Error ? err.message : String(err)})`);
  }

  const game = new GameScreen(pixi);
  pixi.stage.addChild(game.root);
}

function applyViewport(pixi: Application): void {
  const { cssWidth, cssHeight } = computeViewport(window.innerWidth, window.innerHeight);
  const canvas = pixi.canvas;
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  canvas.style.display = 'block';
  canvas.style.touchAction = 'none';
}

boot().catch((err) => {
  console.error(err);
  setStatus(`ошибка запуска: ${err instanceof Error ? err.message : String(err)}`);
});
