import type { Layout } from '../../engine/space-scene.engine';

export interface Zone {
  readonly l: number;
  readonly r: number;
  readonly t: number;
  readonly b: number;
  readonly o: number;
}

export const panelZones = (layout: Layout, dpr: number): Zone[] => {
  const { left, top } = layout.canvas;
  return layout.panels
    .filter(
      (panel) =>
        panel.right > panel.left &&
        panel.bottom > panel.top &&
        panel.opacity >= 0.004,
    )
    .map((panel) => ({
      l: (panel.left - left) * dpr,
      r: (panel.right - left) * dpr,
      t: (panel.top - top) * dpr,
      b: (panel.bottom - top) * dpr,
      o: panel.opacity,
    }));
};

// The text comes before the matter: points behind a panel are dimmed to
// 13%, with a 22 px fade so that no hard hole shows.
export const veilAt = (
  zones: readonly Zone[],
  fade: number,
  px: number,
  py: number,
): number => {
  let f = 1;
  for (const q of zones) {
    const d = Math.min(
      px - q.l + fade,
      q.r + fade - px,
      py - q.t + fade,
      q.b + fade - py,
    );
    if (d > 0) {
      const base = 0.13 + 0.87 * Math.max(0, 1 - d / fade);
      f = Math.min(f, 1 - q.o * (1 - base));
    }
  }
  return f;
};

export const isUnderPanel = (
  zones: readonly Zone[],
  sx: number,
  sy: number,
  dpr: number,
): boolean =>
  zones.some(
    (z) =>
      sx > z.l - 10 * dpr &&
      sx < z.r + 10 * dpr &&
      sy > z.t - 10 * dpr &&
      sy < z.b + 10 * dpr,
  );
