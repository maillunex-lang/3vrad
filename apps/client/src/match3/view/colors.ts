import type { GemColor, PowerKind } from '../types';

/** TEMP glossy palette — replaced in E03 art pass. */
export const GEM_FILL: Record<GemColor, number> = {
  mango: 0xffb347,
  dragon: 0xff4d6d,
  lime: 0x7cfc00,
  passion: 0xc77dff,
  blue: 0x4cc9f0,
};

export const GEM_STROKE: Record<GemColor, number> = {
  mango: 0xff8c00,
  dragon: 0xc9184a,
  lime: 0x2d6a4f,
  passion: 0x7b2cbf,
  blue: 0x0077b6,
};

export const POWER_LABEL: Record<PowerKind, string> = {
  rocket_h: '→',
  rocket_v: '↓',
  bomb: '●',
  pearl: '◆',
  propeller: '✦',
};

export const BOARD_BG = 0x0a4d3c;
export const CELL_BG = 0x12664f;
export const HUD_BG = 0x063528;
