import { clamp01 } from './number.helper';

export const progress = (t: number, a: number, b: number): number =>
  clamp01((t - a) / (b - a));

export const smoothstep = (p: number): number => p * p * (3 - 2 * p);

export const easeOut = (x: number): number => 1 - Math.pow(1 - clamp01(x), 3);

export const halfLifeStep = (dt: number, halfLife: number): number =>
  1 - Math.pow(0.5, dt / halfLife);
