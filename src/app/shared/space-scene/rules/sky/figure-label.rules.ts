import type { Zone } from '../panel-veil.rules';

const FIGURE_LABEL_SIZE = 11;
const FIGURE_LABEL_SPACING = 0.14;
const NAME_GAP = 16;

const labelPixels = (dpr: number): number =>
  Math.round(FIGURE_LABEL_SIZE * dpr);

export const figureLabelFont = (dpr: number): string =>
  `500 ${String(labelPixels(dpr))}px "IBM Plex Mono", ui-monospace, monospace`;

export const figureLabelSpacing = `${String(FIGURE_LABEL_SPACING)}em`;

export interface FigureName {
  readonly x: number;
  readonly y: number;
  readonly baseline: 'bottom' | 'top';
}

interface NameRoom {
  readonly bar: Zone | null;
  readonly dpr: number;
  readonly text: string;
  readonly measure: (text: string) => number;
}

const isUnderBar = (
  name: FigureName,
  bar: Zone,
  { dpr, text, measure }: NameRoom,
): boolean => {
  const size = labelPixels(dpr);
  if (name.y - size >= bar.b || name.y <= bar.t || name.x >= bar.r) {
    return false;
  }
  const width = measure(text) + text.length * FIGURE_LABEL_SPACING * size;
  return name.x + width > bar.l;
};

export const figureNameAt = (
  points: readonly (readonly [number, number])[],
  room: NameRoom,
): FigureName => {
  const left = Math.min(...points.map((p) => p[0]));
  const top = Math.min(...points.map((p) => p[1]));
  const gap = NAME_GAP * room.dpr;
  const above: FigureName = { x: left, y: top - gap, baseline: 'bottom' };
  if (!room.bar || !isUnderBar(above, room.bar, room)) {
    return above;
  }
  const bottom = Math.max(...points.map((p) => p[1]));
  return { x: left, y: bottom + gap, baseline: 'top' };
};
