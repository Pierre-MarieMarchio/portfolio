import type { SceneLayout } from '../models/scene-layout.model';
import { Dims, Frame, referenceRadius } from './camera/camera-frames.rules';
import { areaOf, Box, chromeRooms, viewportOf } from './camera/free-sky.rules';
import {
  discChoice,
  FocusAim,
  middleAt,
  unitDisc,
} from './focus/focus-choices.rules';
import {
  AimedPlace,
  aimedPlace,
  discPlace,
  FocusMemo,
  Hole,
  Placed,
  placingOf,
  Sight,
} from './focus/focus-rows.rules';

export type { FocusAim } from './focus/focus-choices.rules';
export type { FocusMemo } from './focus/focus-rows.rules';

const CLOSE_UP_SHARE = 0.94;

export interface HoleFocus {
  readonly dims: Dims;
  readonly rooms: readonly Box[];
  readonly isCloseUp: boolean;
  readonly aim: FocusAim | null;
}

export interface FocusedFrame {
  readonly frame: Frame;
  readonly memo: FocusMemo | null;
}

const bandTopOf = (layout: SceneLayout | null): number | null =>
  layout?.panelBandTop ?? layout?.cornerBandTop ?? null;

const sideLeftOf = (layout: SceneLayout | null): number | null =>
  layout?.sidePanelLeft ?? layout?.cornerPanelLeft ?? null;

const glassOf = (layout: SceneLayout | null): Box => {
  const { width, height } = viewportOf(layout);
  const canvas = layout?.canvas ?? { left: 0, top: 0 };
  const bandTop = bandTopOf(layout);
  const sideLeft = sideLeftOf(layout) ?? width + canvas.left;
  return bandTop === null
    ? { left: sideLeft - canvas.left, top: 0, right: width, bottom: height }
    : { left: 0, top: bandTop - canvas.top, right: width, bottom: height };
};

export const skyRooms = (layout: SceneLayout | null): Box[] =>
  chromeRooms(layout, glassOf(layout)).filter((room) => areaOf(room) > 0);

const sightOf = (frame: Frame, focus: HoleFocus, radius: number): Sight => {
  const { dims, aim } = focus;
  const name = aim?.name ?? null;
  return {
    looks: [
      dims.w,
      dims.h,
      dims.dpr,
      focus.isCloseUp,
      frame.ev,
      frame.i,
      name?.w,
      name?.h,
    ],
    rooms: focus.rooms,
    radius,
    name,
  };
};

const placedIn = (
  frame: Frame,
  focus: HoleFocus,
  hole: Hole,
  memo: FocusMemo | null,
): Omit<AimedPlace, 'memo'> & { readonly memo: FocusMemo | null } => {
  const sight = sightOf(frame, focus, hole.radius);
  const placing = placingOf(focus.rooms, hole);
  const aim = focus.aim;
  return aim
    ? aimedPlace({ frame, aim, sight }, placing, memo)
    : {
        place: discPlace(discChoice(0, unitDisc(frame)), sight, placing),
        az: frame.az,
        memo: null,
      };
};

const framedOn = (
  frame: Frame,
  { dims: { w, h, dpr }, isCloseUp }: HoleFocus,
  { unit, radius }: { readonly unit: number; readonly radius: number },
  { place, az }: { readonly place: Placed; readonly az: number },
): Frame => {
  const grown = isCloseUp ? place.reach : Math.max(radius, place.reach);
  const { choice, room } = place;
  const x = (room.left + room.right) / 2 - middleAt(choice.across, grown);
  const y = (room.top + room.bottom) / 2 - middleAt(choice.down, grown);
  return {
    ...frame,
    s: grown / unit,
    x: (x * dpr) / w,
    y: (y * dpr) / h,
    az,
  };
};

export const holeInFocus = (
  frame: Frame,
  focus: HoleFocus,
  memo: FocusMemo | null = null,
): FocusedFrame => {
  const { w, h, dpr } = focus.dims;
  const unit =
    (referenceRadius(w, h, 1) / dpr) * (focus.isCloseUp ? CLOSE_UP_SHARE : 1);
  const radius = unit * frame.s;
  if (radius <= 0) {
    return { frame, memo: null };
  }
  const hole = { x: (frame.x * w) / dpr, y: (frame.y * h) / dpr, radius };
  const found = placedIn(frame, focus, hole, memo);
  const place = found.place;
  return {
    frame: place
      ? framedOn(frame, focus, { unit, radius }, { place, az: found.az })
      : frame,
    memo: found.memo,
  };
};

export { phoneFigures } from './figures/phone-figures.rules';
