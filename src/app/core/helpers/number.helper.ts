export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const clamp01 = (value: number): number => clamp(value, 0, 1);

export const finiteOr = (value: number, fallback: number): number =>
  Number.isFinite(value) ? value : fallback;
