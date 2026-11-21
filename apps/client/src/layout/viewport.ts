import { ASPECT, DESIGN_HEIGHT, DESIGN_WIDTH } from '../config';

export type ViewportSize = {
  cssWidth: number;
  cssHeight: number;
  scale: number;
};

/** Fit a 9:16 design rect inside the window (letterbox). */
export function computeViewport(windowWidth: number, windowHeight: number): ViewportSize {
  const windowAspect = windowWidth / Math.max(windowHeight, 1);
  let cssWidth: number;
  let cssHeight: number;
  if (windowAspect > ASPECT) {
    cssHeight = windowHeight;
    cssWidth = windowHeight * ASPECT;
  } else {
    cssWidth = windowWidth;
    cssHeight = windowWidth / ASPECT;
  }
  return {
    cssWidth,
    cssHeight,
    scale: cssWidth / DESIGN_WIDTH,
  };
}

export function designSize(): { width: number; height: number } {
  return { width: DESIGN_WIDTH, height: DESIGN_HEIGHT };
}
