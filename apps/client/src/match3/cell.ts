import type { BlockerKind, Cell, GemColor, PowerKind } from './types';

export function emptyCell(): Cell {
  return { gem: null, power: null, blocker: null, blockerLayers: 0 };
}

export function gemCell(color: GemColor): Cell {
  return { gem: color, power: null, blocker: null, blockerLayers: 0 };
}

export function powerCell(power: PowerKind, color: GemColor | null = null): Cell {
  return { gem: color, power, blocker: null, blockerLayers: 0 };
}

export function crateCell(layers: number): Cell {
  return { gem: null, power: null, blocker: 'crate', blockerLayers: Math.max(1, Math.min(3, layers)) };
}

export function iceCell(color: GemColor, layers: number): Cell {
  return {
    gem: color,
    power: null,
    blocker: 'ice',
    blockerLayers: Math.max(1, Math.min(3, layers)),
  };
}

export function cloneCell(c: Cell): Cell {
  return { ...c };
}

export function isSwappable(c: Cell | undefined): boolean {
  if (!c) return false;
  if (c.blocker === 'crate') return false;
  if (c.blocker === 'ice' && c.blockerLayers > 0) return false;
  return c.gem != null || c.power != null;
}

export function hasContent(c: Cell): boolean {
  return c.gem != null || c.power != null || (c.blocker != null && c.blockerLayers > 0);
}

/** Compact codes for level grids: M/D/L/P/B gems; Rh/Rv/Bm/Pe/Pr powers; C1-3 crates; I1-3 ice+color like I2M */
export function parseCellCode(code: string, fallbackColor: GemColor = 'mango'): Cell {
  const t = code.trim();
  if (t === '.' || t === '' || t === '_') return emptyCell();
  if (/^C[1-3]$/i.test(t)) return crateCell(Number(t[1]));
  if (/^I[1-3][MDLPB]$/i.test(t)) {
    const layers = Number(t[1]);
    return iceCell(colorFromChar(t[2]!), layers);
  }
  if (t === 'Rh') return powerCell('rocket_h');
  if (t === 'Rv') return powerCell('rocket_v');
  if (t === 'Bm') return powerCell('bomb');
  if (t === 'Pe') return powerCell('pearl');
  if (t === 'Pr') return powerCell('propeller');
  if (t.length === 1) return gemCell(colorFromChar(t) ?? fallbackColor);
  throw new Error(`Unknown cell code: ${code}`);
}

export function colorFromChar(ch: string): GemColor {
  switch (ch.toUpperCase()) {
    case 'M':
      return 'mango';
    case 'D':
      return 'dragon';
    case 'L':
      return 'lime';
    case 'P':
      return 'passion';
    case 'B':
      return 'blue';
    default:
      throw new Error(`Unknown color char: ${ch}`);
  }
}

export function colorChar(color: GemColor): string {
  return { mango: 'M', dragon: 'D', lime: 'L', passion: 'P', blue: 'B' }[color];
}

export function damageBlocker(c: Cell, amount = 1): { destroyed: boolean; kind: BlockerKind | null } {
  if (!c.blocker || c.blockerLayers <= 0) return { destroyed: false, kind: null };
  const kind = c.blocker;
  c.blockerLayers = Math.max(0, c.blockerLayers - amount);
  if (c.blockerLayers === 0) {
    c.blocker = null;
    if (kind === 'crate') {
      c.gem = null;
      c.power = null;
    }
    return { destroyed: true, kind };
  }
  return { destroyed: false, kind };
}
