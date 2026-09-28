import { nearestTurn } from '@app/core/helpers';
import type { SceneLayout } from '../models/scene-layout.model';
import { Dims, Frame, referenceRadius } from './camera/camera-frames.rules';
import { areaOf, Box, chromeRooms, viewportOf } from './camera/free-sky.rules';
import {
  DISC_REACH,
  DrawnDisc,
  isBoxOverDisc,
  LENS_REACH,
} from './camera/pointer.rules';
import { flattening, opening } from './camera/projection.rules';

const FOCUS = {
  growth: 2,
  margin: 12,
  target: 24,
  nameGap: 28,
  nameSide: 62,
  clearance: 2.9 / DISC_REACH,
  closeUp: 0.94,
  angles: 12,
  tie: 0.01,
} as const;

export interface FocusAim {
  readonly angle: number;
  readonly name: { readonly w: number; readonly h: number };
  readonly offset: (
    az: number,
    tilt: Pick<Frame, 'ev' | 'i'>,
  ) => { readonly nx: number; readonly ny: number };
}

export interface HoleFocus {
  readonly dims: Dims;
  readonly rooms: readonly Box[];
  readonly isCloseUp: boolean;
  readonly aim: FocusAim | null;
}

type Span = readonly [slope: number, pad: number];

interface Extent {
  readonly low: readonly Span[];
  readonly high: readonly Span[];
}

interface Choice {
  readonly az: number;
  readonly across: Extent;
  readonly down: Extent;
  readonly isNameClear: (radius: number) => boolean;
}

interface Placed {
  readonly reach: number;
  readonly rank: number;
  readonly distance: number;
  readonly room: Box;
  readonly choice: Choice;
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

const unitDisc = (tilt: Pick<Frame, 'ev' | 'i'>): DrawnDisc => ({
  x: 0,
  y: 0,
  rx: DISC_REACH,
  ry: Math.max(LENS_REACH, DISC_REACH * opening(tilt.ev) * flattening(tilt.ev)),
  cos: Math.cos(tilt.i),
  sin: Math.sin(tilt.i),
});

const reachWithin = (extent: Extent, room: number): number => {
  let reach = Infinity;
  for (const [highSlope, highPad] of extent.high) {
    for (const [lowSlope, lowPad] of extent.low) {
      const slope = highSlope - lowSlope;
      const pad = highPad - lowPad;
      if (slope > 0) {
        reach = Math.min(reach, (room - pad) / slope);
      } else if (pad > room) {
        reach = 0;
      }
    }
  }
  return Math.max(0, reach);
};

const middleAt = (extent: Extent, radius: number): number => {
  const at = ([slope, pad]: Span): number => slope * radius + pad;
  return (
    (Math.max(...extent.high.map((span) => at(span))) +
      Math.min(...extent.low.map((span) => at(span)))) /
    2
  );
};

const discChoice = (az: number, disc: DrawnDisc): Choice => {
  const across = Math.hypot(disc.rx * disc.cos, disc.ry * disc.sin);
  const down = Math.hypot(disc.rx * disc.sin, disc.ry * disc.cos);
  return {
    az,
    across: { low: [[-across, 0]], high: [[across, 0]] },
    down: { low: [[-down, 0]], high: [[down, 0]] },
    isNameClear: () => true,
  };
};

type NameBox = readonly [
  left: number,
  right: number,
  top: number,
  bottom: number,
];

const nameBoxes = (
  name: FocusAim['name'] | null,
  outward: number,
): NameBox[] => {
  if (!name) {
    return [[0, 0, 0, 0]];
  }
  const { w, h } = name;
  const side = FOCUS.nameSide;
  const row = h / 2 + 4;
  const stack = FOCUS.nameGap + h;
  const lefts = [-w / 2, outward > 0 ? -FOCUS.target : FOCUS.target - w];
  return [
    ...lefts.flatMap((left): NameBox[] => [
      [left, left + w, FOCUS.target, stack],
      [left, left + w, -stack, -FOCUS.target],
    ]),
    [side, side + w, -row, row],
    [-side - w, -side, -row, row],
  ];
};

const pairChoice = (
  az: number,
  disc: DrawnDisc,
  offset: { readonly nx: number; readonly ny: number },
  [left, right, top, bottom]: NameBox,
): Choice => {
  const { nx, ny } = offset;
  const target = FOCUS.target;
  const alone = discChoice(az, disc);
  return {
    az,
    across: {
      low: [...alone.across.low, [nx, Math.min(-target, left)]],
      high: [...alone.across.high, [nx, Math.max(target, right)]],
    },
    down: {
      low: [...alone.down.low, [ny, Math.min(-target, top)]],
      high: [...alone.down.high, [ny, Math.max(target, bottom)]],
    },
    isNameClear: (radius) =>
      !isBoxOverDisc(
        { ...disc, rx: disc.rx * radius, ry: disc.ry * radius },
        {
          l: nx * radius + left,
          r: nx * radius + right,
          t: ny * radius + top,
          b: ny * radius + bottom,
        },
        4,
      ),
  };
};

const isClearOfDisc = (
  offset: { readonly nx: number; readonly ny: number },
  disc: DrawnDisc,
): boolean => {
  const u =
    (offset.nx * disc.cos + offset.ny * disc.sin) / (disc.rx * FOCUS.clearance);
  const v =
    (offset.ny * disc.cos - offset.nx * disc.sin) / (disc.ry * FOCUS.clearance);
  return u * u + v * v >= 1;
};

const angleGap = (a: number, b: number): number =>
  Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

const choicesOf = (
  frame: Frame,
  aim: FocusAim | null,
  isNamed: boolean,
): Choice[] => {
  const disc = unitDisc(frame);
  if (!aim) {
    return [discChoice(frame.az, disc)];
  }
  const today = aim.angle + frame.az;
  const angles = [
    today,
    ...Array.from(
      { length: FOCUS.angles + 1 },
      (_, k) => (k * Math.PI) / FOCUS.angles,
    ).sort((a, b) => angleGap(a, today) - angleGap(b, today)),
  ];
  const name = isNamed ? aim.name : null;
  return angles.flatMap((angle) => {
    const az = nearestTurn(angle - aim.angle, frame.az);
    const offset = aim.offset(az, frame);
    return isClearOfDisc(offset, disc)
      ? nameBoxes(name, offset.nx).map((box) =>
          pairChoice(az, disc, offset, box),
        )
      : [];
  });
};

const isBetter = (next: Placed, best: Placed | null): boolean =>
  !best ||
  next.reach > best.reach + FOCUS.tie ||
  (next.reach >= best.reach - FOCUS.tie &&
    (next.rank < best.rank ||
      (next.rank === best.rank && next.distance < best.distance)));

const bestPlace = (
  choices: readonly Choice[],
  rooms: readonly Box[],
  hole: { readonly x: number; readonly y: number; readonly radius: number },
): Placed | null => {
  const inset = 2 * FOCUS.margin;
  let best: Placed | null = null;
  for (const [rank, choice] of choices.entries()) {
    for (const room of rooms) {
      const reach = Math.min(
        FOCUS.growth * hole.radius,
        reachWithin(choice.across, room.right - room.left - inset),
        reachWithin(choice.down, room.bottom - room.top - inset),
      );
      const distance = Math.hypot(
        (room.left + room.right) / 2 - hole.x,
        (room.top + room.bottom) / 2 - hole.y,
      );
      const next = { reach, rank, distance, room, choice };
      if (isBetter(next, best) && choice.isNameClear(reach)) {
        best = next;
      }
    }
  }
  return best && best.reach > 0 ? best : null;
};

export const holeInFocus = (frame: Frame, focus: HoleFocus): Frame => {
  const { w, h, dpr } = focus.dims;
  const unit =
    (referenceRadius(w, h, 1) / dpr) * (focus.isCloseUp ? FOCUS.closeUp : 1);
  const radius = unit * frame.s;
  if (radius <= 0) {
    return frame;
  }
  const hole = { x: (frame.x * w) / dpr, y: (frame.y * h) / dpr, radius };
  const placeOf = (isNamed: boolean): Placed | null =>
    bestPlace(choicesOf(frame, focus.aim, isNamed), focus.rooms, hole);
  const best = placeOf(true) ?? placeOf(false);
  if (!best) {
    return frame;
  }
  const grown = focus.isCloseUp ? best.reach : Math.max(radius, best.reach);
  const { room, choice } = best;
  const x = (room.left + room.right) / 2 - middleAt(choice.across, grown);
  const y = (room.top + room.bottom) / 2 - middleAt(choice.down, grown);
  return {
    ...frame,
    s: grown / unit,
    x: (x * dpr) / w,
    y: (y * dpr) / h,
    az: choice.az,
  };
};

export { phoneFigures } from './figures/phone-figures.rules';
