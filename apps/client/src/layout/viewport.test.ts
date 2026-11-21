import { describe, expect, it } from 'vitest';
import { computeViewport } from './viewport';

describe('computeViewport', () => {
  it('letterboxes a landscape window to 9:16', () => {
    const v = computeViewport(1920, 1080);
    expect(v.cssHeight).toBe(1080);
    expect(v.cssWidth).toBeCloseTo(1080 * (9 / 16), 5);
    expect(v.scale).toBeGreaterThan(0);
  });

  it('pillarboxes a tall-narrow phone-like window when taller than 9:16', () => {
    // 360x800 is taller than 9:16 (360x640), so width fills and height is capped
    const v = computeViewport(360, 800);
    expect(v.cssWidth).toBe(360);
    expect(v.cssHeight).toBeCloseTo(360 / (9 / 16), 5);
  });

  it('fills exact 9:16', () => {
    const v = computeViewport(720, 1280);
    expect(v.cssWidth).toBe(720);
    expect(v.cssHeight).toBe(1280);
    expect(v.scale).toBe(1);
  });
});
