import { clamp } from '@app/core/helpers';
import type {
  FrameArea,
  FrameClearance,
  FrameDelta,
  FrameEdge,
  FrameMode,
  FrameRect,
  FrameViewport,
  FrameZone,
} from '../models/window-frame.model';
import type { WindowAnchor } from '../models/window.model';

export const FRAME_MIN_WIDTH = 320;
export const FRAME_MIN_HEIGHT = 200;

const KEY_STEP = 8;
const FAST_KEY_STEP = 64;
const VISIBLE_SIDEWAYS = 150;
const EDGE_LEFT = 16;
const HEAD_GAP = 12;
const SNAP_REACH = 12;
const HALF_GAP = 12;

const KEY_DIRECTIONS = new Map<string, FrameDelta>([
  ['ArrowLeft', { dx: -1, dy: 0 }],
  ['ArrowRight', { dx: 1, dy: 0 }],
  ['ArrowUp', { dx: 0, dy: -1 }],
  ['ArrowDown', { dx: 0, dy: 1 }],
]);

const wholeWithin = (value: number, min: number, max: number): number =>
  clamp(Math.round(value), Math.ceil(min), Math.floor(Math.max(min, max)));

const widthOf = (area: FrameArea): number =>
  Math.max(FRAME_MIN_WIDTH, area.right - area.left);

const heightOf = (area: FrameArea): number =>
  Math.max(FRAME_MIN_HEIGHT, area.bottom - area.top);

export const clampMove = (
  frame: FrameRect,
  viewport: FrameViewport,
  clearance: FrameClearance,
): FrameRect => ({
  ...frame,
  x: wholeWithin(
    frame.x,
    EDGE_LEFT + VISIBLE_SIDEWAYS - frame.width,
    viewport.width - VISIBLE_SIDEWAYS,
  ),
  y: wholeWithin(frame.y, clearance.top, viewport.height - clearance.bottom),
});

export const clampResize = (
  start: FrameRect,
  edge: FrameEdge,
  delta: FrameDelta,
  area: FrameArea,
): FrameRect => {
  const right = start.x + start.width;
  const bottom = start.y + start.height;
  const eastWidth = wholeWithin(
    start.width + delta.dx,
    FRAME_MIN_WIDTH,
    Math.min(widthOf(area), Math.max(area.right, right) - start.x),
  );
  const westWidth = wholeWithin(
    start.width - delta.dx,
    FRAME_MIN_WIDTH,
    Math.min(widthOf(area), right - Math.min(area.left, start.x)),
  );
  const eastward = edge.includes('e') ? eastWidth : start.width;
  const width = edge.includes('w') ? westWidth : eastward;
  const height = edge.includes('s')
    ? wholeWithin(
        start.height + delta.dy,
        FRAME_MIN_HEIGHT,
        Math.min(heightOf(area), Math.max(area.bottom, bottom) - start.y),
      )
    : start.height;
  const x = edge.includes('w') ? right - width : start.x;
  return { x, y: start.y, width, height };
};

export const keyResize = (
  frame: FrameRect,
  delta: FrameDelta,
  area: FrameArea,
): FrameRect => {
  const eastward = clampResize(frame, 'se', delta, area);
  const isBlocked = delta.dx > 0 && eastward.width < frame.width + delta.dx;
  return isBlocked
    ? clampResize(frame, 'sw', { dx: -delta.dx, dy: delta.dy }, area)
    : eastward;
};

export const areaOf = (
  layout: FrameArea,
  anchor: WindowAnchor,
  viewport: FrameViewport,
  reserve: number,
): FrameArea => ({
  left: Math.max(0, viewport.width - layout.right),
  right: layout.right,
  top: anchor === 'top' ? layout.top : reserve,
  bottom: anchor === 'top' ? viewport.height - reserve : layout.bottom,
});

export const isZone = (mode: FrameMode | null): mode is FrameZone =>
  mode !== null && mode !== 'free';

export const snapZoneOf = (
  x: number,
  y: number,
  viewport: FrameViewport,
): FrameZone | null => {
  if (x <= SNAP_REACH) {
    return 'left';
  }
  if (x >= viewport.width - 1 - SNAP_REACH) {
    return 'right';
  }
  return y <= SNAP_REACH ? 'full' : null;
};

export const frameOfZone = (zone: FrameZone, area: FrameArea): FrameRect => {
  const height = heightOf(area);
  if (zone === 'full') {
    return { x: area.left, y: area.top, width: widthOf(area), height };
  }
  const width = Math.max(
    FRAME_MIN_WIDTH,
    Math.floor((area.right - area.left - HALF_GAP) / 2),
  );
  const x = zone === 'left' ? area.left : area.right - width;
  return { x, y: area.top, width, height };
};

export const keyStep = (key: string, isFast: boolean): FrameDelta | null => {
  const direction = KEY_DIRECTIONS.get(key);
  if (!direction) {
    return null;
  }
  const step = isFast ? FAST_KEY_STEP : KEY_STEP;
  return { dx: direction.dx * step, dy: direction.dy * step };
};

export const unsnapAt = (
  zoned: FrameRect,
  width: number,
  pointerX: number,
): number =>
  Math.round(pointerX - ((pointerX - zoned.x) * width) / zoned.width);

export const clearanceOf = (
  headBottom: number,
  reserve: number,
  barHeight: number,
): FrameClearance => ({
  top: headBottom + HEAD_GAP,
  bottom: reserve + barHeight,
});

export const fittedHeight = (
  layout: { readonly top: number; readonly height: number },
  anchor: WindowAnchor,
  viewport: FrameViewport,
  limits: { readonly reserve: number; readonly ceiling: number },
): number => {
  const room =
    anchor === 'bottom'
      ? layout.top + layout.height - limits.reserve
      : viewport.height - layout.top - limits.reserve;
  return Math.min(Math.max(FRAME_MIN_HEIGHT, room), limits.ceiling);
};
