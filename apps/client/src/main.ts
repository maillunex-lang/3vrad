import { Application, Assets } from 'pixi.js';
import {
  blockerPath,
  buildingSpritePath,
  CHAR,
  gemPath,
  powerPath,
  UI,
  VFX,
  ZONE_BG,
} from './assets/catalog';
import { DESIGN_HEIGHT, DESIGN_WIDTH } from './config';
import { computeViewport } from './layout/viewport';
import { AppShell } from './ui/AppShell';

const appRoot = document.getElementById('app');
const statusEl = document.getElementById('status');

function setStatus(text: string): void {
  if (statusEl) statusEl.textContent = text;
}

async function preloadCoreAssets(): Promise<void> {
  const buildingUrls: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const id = `B${String(i).padStart(2, '0')}`;
    buildingUrls.push(buildingSpritePath(id, 0));
    buildingUrls.push(buildingSpritePath(id, 1));
    buildingUrls.push(buildingSpritePath(id, 3, 'tropical'));
  }
  const urls = [
    ...['mango', 'dragon', 'lime', 'passion', 'blue'].map(gemPath),
    ...['rocket_h', 'bomb', 'pearl', 'propeller'].map(powerPath),
    blockerPath('crate'),
    blockerPath('ice'),
    ...Object.values(UI),
    ...Object.values(ZONE_BG),
    ...Object.values(CHAR),
    ...Object.values(VFX),
    ...buildingUrls,
  ];
  await Promise.all(
    urls.map(async (u) => {
      try {
        await Assets.load(u);
      } catch (e) {
        console.warn('asset skip', u, e);
      }
    }),
  );
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

  setStatus('загрузка графики…');
  await preloadCoreAssets();
  setStatus('Райский остров · карта + Match-3');

  const shell = new AppShell(pixi);
  pixi.stage.addChild(shell.root);
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
