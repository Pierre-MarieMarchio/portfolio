import { SCENE_CONFIG } from './scene-config.model';
export const CURSOR_REACH = SCENE_CONFIG.sky.cursorReach;

export const SHADOW_EDGE = 1.02;

export const ORBIT_RATE = SCENE_CONFIG.camera.orbitRate;

export const JOURNEY_ELEVATION = 0.022;
export const MIN_ELEVATION = 0.018;

export const DISK_LIFT = 0.04;

export const SKY_NEUTRAL = { camX: 0.42, camY: 0.46, elev: 0.18 } as const;
export const SKY_DRIFT = SCENE_CONFIG.sky.drift;
export const PAN_PARALLAX = SCENE_CONFIG.sky.panParallax;

export const REFERENCE_VIEWPORT = { width: 1280, height: 800 } as const;
export const FALLBACK_VIEWPORT = { width: 1200, height: 800 } as const;
