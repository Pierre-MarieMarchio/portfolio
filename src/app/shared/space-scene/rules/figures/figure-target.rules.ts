import { isUnderPanel, Zone } from '../panel-veil.rules';
import type { SkyRoom } from './figure-room.rules';

export const FIGURE_TARGET_MIN = 44;

export interface FigureTarget {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly isInert: boolean;
}

interface TargetStage {
  readonly w: number;
  readonly h: number;
  readonly dpr: number;
  readonly zones: readonly Zone[];
  readonly isShown: boolean;
}

export const figureTargetOf = (
  box: SkyRoom,
  { w, h, dpr, zones, isShown }: TargetStage,
): FigureTarget => {
  const cx = (box.l + box.r) / 2;
  const cy = (box.t + box.b) / 2;
  const width = Math.max(FIGURE_TARGET_MIN, (box.r - box.l) / dpr);
  const height = Math.max(FIGURE_TARGET_MIN, (box.b - box.t) / dpr);
  const isOffScreen = cx < 0 || cx > w || cy < 0 || cy > h;
  return {
    x: cx / dpr - width / 2,
    y: cy / dpr - height / 2,
    width,
    height,
    isInert: !isShown || isOffScreen || isUnderPanel(zones, cx, cy, dpr),
  };
};

export const isOverTarget = (
  target: FigureTarget,
  point: { readonly x: number; readonly y: number } | null,
  dpr: number,
): boolean =>
  !target.isInert &&
  point !== null &&
  point.x >= target.x * dpr &&
  point.x <= (target.x + target.width) * dpr &&
  point.y >= target.y * dpr &&
  point.y <= (target.y + target.height) * dpr;
