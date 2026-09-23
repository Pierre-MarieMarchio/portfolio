import type { Dims } from './camera-frames.rules';
import { opening } from '../scene-bodies.rules';
import type { PlanePoint } from '../../engine/motions/turntable.motion';
import type { SceneFrame } from '../scene-frame.rules';

export interface DiskOnScreen {
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
  readonly cr: number;
  readonly sr: number;
  readonly squash: number;
}

export const diskOnScreen = (frame: SceneFrame): DiskOnScreen => ({
  cx: frame.cx,
  cy: frame.cy,
  radius: frame.radius,
  cr: frame.cr,
  sr: frame.sr,
  squash: opening(frame.elev) * frame.flatten,
});

export const pointerOnCanvas = (
  x: number,
  y: number,
  dims: Dims,
): { x: number; y: number } | null => {
  const dpr = dims.dpr;
  const cssW = dims.w / dpr;
  const cssH = dims.h / dpr;
  const isInside = x > -80 && x < cssW + 80 && y > -80 && y < cssH + 80;
  return isInside ? { x: x * dpr, y: y * dpr } : null;
};

export const onDiskPlane = (
  disk: DiskOnScreen | null,
  canvasX: number,
  canvasY: number,
): PlanePoint | null => {
  if (!disk || disk.radius <= 0) {
    return null;
  }
  const px = canvasX - disk.cx;
  const py = canvasY - disk.cy;
  const x = (px * disk.cr + py * disk.sr) / disk.radius;
  const y = (-px * disk.sr + py * disk.cr) / disk.radius / disk.squash;
  return { angle: Math.atan2(y, x), radius: Math.hypot(x, y) };
};
