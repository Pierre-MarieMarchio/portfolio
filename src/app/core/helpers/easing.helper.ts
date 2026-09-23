import { clamp01 } from './number.helper';

/** Progress of `t` through the window [a, b], clamped to 0..1. */
export const progress = (t: number, a: number, b: number): number =>
  clamp01((t - a) / (b - a));

export const smoothstep = (p: number): number => p * p * (3 - 2 * p);

export const easeOut = (x: number): number => 1 - Math.pow(1 - clamp01(x), 3);

/**
 * The share of the remaining distance covered in `dt` seconds, for a motion
 * that halves what is left every `halfLife` seconds. Never a fixed lerp
 * coefficient: the motion would then depend on the frame rate.
 */
export const halfLifeStep = (dt: number, halfLife: number): number =>
  1 - Math.pow(0.5, dt / halfLife);
