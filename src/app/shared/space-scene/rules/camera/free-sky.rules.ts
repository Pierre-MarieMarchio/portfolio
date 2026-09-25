import { clamp } from '@app/core/helpers';
import type { SceneLayout } from '../../models/scene-layout.model';
import { Dims, Frame, referenceRadius } from './camera-frames.rules';
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
