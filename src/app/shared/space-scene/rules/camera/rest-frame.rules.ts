import { clamp } from '@app/core/helpers';
import { FALLBACK_VIEWPORT } from '../../models/scene-constants.model';
import {
  Frame,
  REST_FRAME,
  referenceRadius,
  verticalFactor,
} from './camera-frames.rules';
import { opening } from './projection.rules';

const unitRadius = (w: number, h: number): number => referenceRadius(w, h, 1);

export const REST_SCALE = { min: 0.07, max: 0.42 } as const;

export interface RestMeasure {
  readonly x: number;
  readonly y: number;
  readonly s: number;
  readonly i: number;
  readonly ev: number;
  readonly freeHalf: number;
  readonly sideHalf?: number;
}

export interface RestRoom {
  readonly x: number;
  readonly y: number;
  readonly freeHalf: number;
  readonly sideHalf?: number;
}

const UPRIGHT_REST = { ev: 0.6, i: -0.45 } as const;

const uprightTilt = (
  roomFactor: number,
  flat: Pick<Frame, 'ev' | 'i'>,
): Pick<Frame, 'ev' | 'i'> => {
  const ev = Math.min(
    UPRIGHT_REST.ev,
    (roomFactor - Math.abs(Math.sin(UPRIGHT_REST.i)) - opening(0)) /
      (opening(1) - opening(0)),
  );
  return ev > flat.ev ? { ev, i: UPRIGHT_REST.i } : flat;
};

export const restIn = (
  viewport: { readonly width: number; readonly height: number },
  room: RestRoom,
): RestMeasure => {
  const vh = viewport.height || FALLBACK_VIEWPORT.height;
  const vw = viewport.width || FALLBACK_VIEWPORT.width;
  const { freeHalf, sideHalf } = room;
  const tight = clamp(1 - freeHalf / 260, 0, 1);
  const i = REST_FRAME.i + 0.3 * tight;
  const flat = Math.max(0.12, REST_FRAME.ev - 0.16 * tight);
  const budget = (freeHalf - 30) / 6.6 / unitRadius(vw, vh);
  const upright = budget / verticalFactor(flat, i);
  const fitted =
    sideHalf === undefined
      ? upright
      : Math.min(upright, sideHalf / 6.6 / unitRadius(vw, vh));
  const s = clamp(fitted, REST_SCALE.min, REST_SCALE.max);
  const tilt =
    vh > vw && fitted > REST_SCALE.max
      ? uprightTilt(budget / s, { ev: flat, i })
      : { ev: flat, i };
  const measure = { x: room.x, y: room.y, s, i: tilt.i, ev: tilt.ev, freeHalf };
  return sideHalf === undefined ? measure : { ...measure, sideHalf };
};

export const measureRest = (
  viewport: { readonly width: number; readonly height: number },
  headHeight: number | null,
  ruleHeight: number | null,
): RestMeasure => {
  const vh = viewport.height || FALLBACK_VIEWPORT.height;
  const top = (headHeight ?? 72) + Math.min(40, vh * 0.05) + 18;
  const margin = Math.max(74, Math.min(92, vh * 0.09));
  const band = (ruleHeight ?? 56) + margin;
  const bottom = vh - band - 18;
  return restIn(viewport, {
    x: REST_FRAME.x,
    y: clamp((top + bottom) / 2 / vh, 0.14, 0.72),
    freeHalf: Math.max(26, (bottom - top) / 2),
  });
};
