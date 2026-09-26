import type { Dims } from './camera-frames.rules';
import { opening } from './projection.rules';
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

export const DISC_REACH = 2.4;
export const LENS_REACH = 1.3;

export interface DrawnDisc {
  readonly x: number;
  readonly y: number;
  readonly rx: number;
  readonly ry: number;
  readonly cos: number;
  readonly sin: number;
}

export const drawnDisc = (disk: DiskOnScreen, dpr: number): DrawnDisc => ({
  x: disk.cx / dpr,
  y: disk.cy / dpr,
  rx: (DISC_REACH * disk.radius) / dpr,
  ry: (Math.max(LENS_REACH, DISC_REACH * disk.squash) * disk.radius) / dpr,
  cos: disk.cr,
  sin: disk.sr,
});

interface Corner {
  readonly u: number;
  readonly v: number;
}

const distanceToSegment = (a: Corner, b: Corner): number => {
  const du = b.u - a.u;
  const dv = b.v - a.v;
  const t = Math.min(
    1,
    Math.max(0, -(a.u * du + a.v * dv) / (du * du + dv * dv || 1)),
  );
  return Math.hypot(a.u + t * du, a.v + t * dv);
};

const isOriginInside = (corners: readonly Corner[]): boolean => {
  const sides = corners.map((a, k) => {
    const b = corners[(k + 1) % corners.length] ?? a;
    return Math.sign(a.u * b.v - a.v * b.u);
  });
  return sides.every((side) => side >= 0) || sides.every((side) => side <= 0);
};

export const isBoxOverDisc = (
  disc: DrawnDisc,
  box: {
    readonly l: number;
    readonly t: number;
    readonly r: number;
    readonly b: number;
  },
  clearance: number,
): boolean => {
  if (disc.rx <= 0 || disc.ry <= 0) {
    return false;
  }
  const rx = disc.rx + clearance;
  const ry = disc.ry + clearance;
  const corners = [
    [box.l, box.t],
    [box.r, box.t],
    [box.r, box.b],
    [box.l, box.b],
  ].map(([cx = 0, cy = 0]): Corner => {
    const dx = cx - disc.x;
    const dy = cy - disc.y;
    return {
      u: (dx * disc.cos + dy * disc.sin) / rx,
      v: (dy * disc.cos - dx * disc.sin) / ry,
    };
  });
  return (
    isOriginInside(corners) ||
    corners.some((a, k) => distanceToSegment(a, corners[(k + 1) % 4] ?? a) < 1)
  );
};

export const clientOnCanvas = (
  clientX: number,
  clientY: number,
  canvas: { readonly left: number; readonly top: number } | undefined,
  dpr: number,
): { x: number; y: number } | null =>
  canvas
    ? { x: (clientX - canvas.left) * dpr, y: (clientY - canvas.top) * dpr }
    : null;

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
