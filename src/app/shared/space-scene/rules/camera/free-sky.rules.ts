import { clamp } from '@app/core/helpers';
import type { PanelRect, SceneLayout } from '../../models/scene-layout.model';
import { FALLBACK_VIEWPORT } from '../../models/scene-constants.model';
import { Dims, Frame, referenceRadius } from './camera-frames.rules';
import { REST_SCALE, restIn, RestMeasure } from './rest-frame.rules';
import { flattening, opening } from './projection.rules';

export interface FreeSky {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

const WHOLE_OBJECT = { margin: 28, gap: 16, growth: 2, floor: 0.04 } as const;

export const freeSkyOf = (
  layout: SceneLayout | null,
  canvasWidth: number,
): FreeSky | null => {
  if (!layout) {
    return null;
  }
  const top = (layout.topBarHeight ?? 0) - layout.canvas.top;
  const bandTop = layout.panelBandTop;
  if (typeof bandTop === 'number') {
    return {
      left: 0,
      right: canvasWidth,
      top,
      bottom: bandTop - layout.canvas.top,
    };
  }
  const sideLeft = layout.sidePanelLeft;
  if (typeof sideLeft === 'number') {
    return {
      left: 0,
      right: sideLeft - layout.canvas.left - WHOLE_OBJECT.gap,
      top,
      bottom: layout.viewport.height - layout.canvas.top,
    };
  }
  return null;
};

export const outermostReach = (
  orbits: readonly { readonly rb: number }[],
): number => orbits.reduce((reach, orbit) => Math.max(reach, orbit.rb), 0);

const discSpan = (
  tilt: Pick<Frame, 'ev' | 'i'>,
): { readonly across: number; readonly down: number } => {
  const depth = opening(tilt.ev) * flattening(tilt.ev);
  const cr = Math.cos(tilt.i);
  const sr = Math.sin(tilt.i);
  return {
    across: Math.hypot(cr, depth * sr),
    down: Math.hypot(sr, depth * cr),
  };
};

export const wholeInFreeSky = (
  frame: Frame,
  {
    dims,
    sky,
    reach,
  }: {
    readonly dims: Dims;
    readonly sky: FreeSky;
    readonly reach: number;
  },
): Frame => {
  const { w, h, dpr } = dims;
  const margin = WHOLE_OBJECT.margin * dpr;
  const halfWidth = ((sky.right - sky.left) / 2) * dpr - margin;
  const halfHeight = ((sky.bottom - sky.top) / 2) * dpr - margin;
  const span = discSpan(frame);
  const unit = referenceRadius(w, h, 1) * Math.max(reach, 1);
  const s = Math.max(
    WHOLE_OBJECT.floor,
    Math.min(
      frame.s * WHOLE_OBJECT.growth,
      halfWidth / (unit * span.across),
      halfHeight / (unit * span.down),
    ),
  );
  return {
    ...frame,
    s,
    x: clamp((((sky.left + sky.right) / 2) * dpr) / w, 0, 1),
    y: clamp((((sky.top + sky.bottom) / 2) * dpr) / h, 0, 1),
  };
};

const REST_SKY = { clearance: 12, inset: 8, reach: 30, leader: 48 } as const;

type Box = Pick<PanelRect, 'left' | 'top' | 'right' | 'bottom'>;

const isHoleClear = (
  rest: RestMeasure,
  viewport: SceneLayout['viewport'],
  chrome: readonly Box[],
): boolean => {
  const cx = rest.x * viewport.width;
  const cy = rest.y * viewport.height;
  const reach =
    referenceRadius(viewport.width, viewport.height, rest.s) +
    REST_SKY.clearance;
  return chrome.every((box) => {
    const dx = cx - clamp(cx, box.left, box.right);
    const dy = cy - clamp(cy, box.top, box.bottom);
    return Math.hypot(dx, dy) >= reach;
  });
};

const edgesAcross = (
  chrome: readonly Box[],
  far: number,
  sides: readonly ['left' | 'top', 'right' | 'bottom'],
): number[] => [
  ...new Set([
    0,
    far,
    ...chrome.flatMap((box) =>
      [box[sides[0]], box[sides[1]]].map((edge) => clamp(edge, 0, far)),
    ),
  ]),
];

const isEmpty = (room: Box, chrome: readonly Box[]): boolean =>
  chrome.every(
    (box) =>
      box.right <= room.left ||
      box.left >= room.right ||
      box.bottom <= room.top ||
      box.top >= room.bottom,
  );

const spansOf = (edges: readonly number[]): [number, number][] =>
  edges.flatMap((from) =>
    edges.filter((to) => to > from).map((to): [number, number] => [from, to]),
  );

const emptyRooms = (
  chrome: readonly Box[],
  viewport: SceneLayout['viewport'],
): Box[] => {
  const xs = edgesAcross(chrome, viewport.width, ['left', 'right']);
  const ys = edgesAcross(chrome, viewport.height, ['top', 'bottom']);
  return spansOf(xs).flatMap(([left, right]) =>
    spansOf(ys)
      .map(([top, bottom]) => ({ left, top, right, bottom }))
      .filter((room) => isEmpty(room, chrome)),
  );
};

const leaderRoom = (viewport: SceneLayout['viewport']): number =>
  viewport.height > viewport.width ? REST_SKY.leader : 0;

const restInRoom = (
  room: Box,
  viewport: SceneLayout['viewport'],
): RestMeasure => {
  const inset = REST_SKY.inset;
  const width = room.right - room.left - 2 * inset;
  const height = room.bottom - room.top - 2 * inset;
  return restIn(viewport, {
    x: (room.left + room.right) / 2 / viewport.width,
    y: (room.top + room.bottom) / 2 / viewport.height,
    freeHalf: Math.max(0, height / 2),
    sideHalf: Math.max(0, width / 2 - REST_SKY.reach - leaderRoom(viewport)),
  });
};

const areaOf = (room: Box): number =>
  (room.right - room.left) * (room.bottom - room.top);

const chromeOnCanvas = (layout: SceneLayout | null): Box[] => {
  const left = layout?.canvas.left ?? 0;
  const top = layout?.canvas.top ?? 0;
  return (layout?.chrome ?? []).map((box) => ({
    left: box.left - left,
    top: box.top - top,
    right: box.right - left,
    bottom: box.bottom - top,
  }));
};

const viewportOf = (layout: SceneLayout | null): SceneLayout['viewport'] => ({
  width: layout?.viewport.width || FALLBACK_VIEWPORT.width,
  height: layout?.viewport.height || FALLBACK_VIEWPORT.height,
});

const widestRest = (
  chrome: readonly Box[],
  viewport: SceneLayout['viewport'],
): RestMeasure | null => {
  let best: { readonly rest: RestMeasure; readonly area: number } | null = null;
  for (const room of emptyRooms(chrome, viewport)) {
    const rest = restInRoom(room, viewport);
    const area = areaOf(room);
    const isWider =
      !best ||
      rest.s > best.rest.s ||
      (rest.s === best.rest.s && area > best.area);
    if (isWider) {
      best = { rest, area };
    }
  }
  return best?.rest ?? null;
};

export const restInFreeSky = (
  layout: SceneLayout | null,
  band: RestMeasure,
): RestMeasure => {
  const chrome = chromeOnCanvas(layout);
  const viewport = viewportOf(layout);
  const isBandClear =
    band.s > REST_SCALE.min && isHoleClear(band, viewport, chrome);
  return chrome.length === 0 || isBandClear
    ? band
    : (widestRest(chrome, viewport) ?? band);
};
