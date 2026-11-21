export const DESIGN_WIDTH = 720;
export const DESIGN_HEIGHT = 1280;
export const ASPECT = DESIGN_WIDTH / DESIGN_HEIGHT; // 9:16

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8080';

export const APP_VERSION = '0.1.0-e01';
