import { nearestTurn } from '@app/core/helpers';
import type { Frame } from '../camera/camera-frames.rules';
import {
  DISC_REACH,
  DrawnDisc,
  isBoxOverDisc,
  LENS_REACH,
} from '../camera/pointer.rules';
import { flattening, opening } from '../camera/projection.rules';

const GROUP = {
  target: 24,
  nameGap: 28,
  nameSide: 62,
  clearance: 2.9 / DISC_REACH,
  angles: 12,
} as const;

export interface FocusAim {
  readonly angle: number;
  readonly name: { readonly w: number; readonly h: number };
  readonly offset: (
    az: number,
    tilt: Pick<Frame, 'ev' | 'i'>,
  ) => { readonly nx: number; readonly ny: number };
}

export interface Offset {
  readonly nx: number;
  readonly ny: number;
}

type Span = readonly [slope: number, pad: number];

interface Extent {
  readonly low: readonly Span[];
  readonly high: readonly Span[];
}

export interface Choice {
  readonly slot: number;
  readonly across: Extent;
  readonly down: Extent;
  readonly isNameClear: (radius: number) => boolean;
}

export const unitDisc = (tilt: Pick<Frame, 'ev' | 'i'>): DrawnDisc => ({
  x: 0,
  y: 0,
  rx: DISC_REACH,
  ry: Math.max(LENS_REACH, DISC_REACH * opening(tilt.ev) * flattening(tilt.ev)),
  cos: Math.cos(tilt.i),
  sin: Math.sin(tilt.i),
});

export const reachWithin = (extent: Extent, room: number): number => {
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

export const middleAt = (extent: Extent, radius: number): number => {
  const at = ([slope, pad]: Span): number => slope * radius + pad;
  return (
    (Math.max(...extent.high.map((span) => at(span))) +
      Math.min(...extent.low.map((span) => at(span)))) /
    2
  );
};

export const discChoice = (slot: number, disc: DrawnDisc): Choice => {
  const across = Math.hypot(disc.rx * disc.cos, disc.ry * disc.sin);
  const down = Math.hypot(disc.rx * disc.sin, disc.ry * disc.cos);
  return {
    slot,
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
  const side = GROUP.nameSide;
  const row = h / 2 + 4;
  const stack = GROUP.nameGap + h;
  const lefts = [-w / 2, outward > 0 ? -GROUP.target : GROUP.target - w];
  return [
    ...lefts.flatMap((left): NameBox[] => [
      [left, left + w, GROUP.target, stack],
      [left, left + w, -stack, -GROUP.target],
    ]),
    [side, side + w, -row, row],
    [-side - w, -side, -row, row],
  ];
};

const pairChoice = (
  slot: number,
  disc: DrawnDisc,
  offset: Offset,
  [left, right, top, bottom]: NameBox,
): Choice => {
  const { nx, ny } = offset;
  const target = GROUP.target;
  const alone = discChoice(slot, disc);
  return {
    slot,
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

const isClearOfDisc = (offset: Offset, disc: DrawnDisc): boolean => {
  const u =
    (offset.nx * disc.cos + offset.ny * disc.sin) / (disc.rx * GROUP.clearance);
  const v =
    (offset.ny * disc.cos - offset.nx * disc.sin) / (disc.ry * GROUP.clearance);
  return u * u + v * v >= 1;
};

const angleGap = (a: number, b: number): number =>
  Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

export interface SlotAim {
  readonly slot: number;
  readonly angle: number;
  readonly az: number;
  readonly offset: Offset;
}

export const slotsOf = (frame: Frame, aim: FocusAim): SlotAim[] => {
  const today = aim.angle + frame.az;
  const angles = [
    today,
    ...Array.from(
      { length: GROUP.angles + 1 },
      (_, k) => (k * Math.PI) / GROUP.angles,
    ),
  ];
  return angles.map((angle, slot) => {
    const az = nearestTurn(angle - aim.angle, frame.az);
    return { slot, angle, az, offset: aim.offset(az, frame) };
  });
};

export const slotOrder = (slots: readonly SlotAim[]): SlotAim[] => {
  const [today, ...around] = slots;
  return today
    ? [
        today,
        ...around.sort(
          (a, b) =>
            angleGap(a.angle, today.angle) - angleGap(b.angle, today.angle),
        ),
      ]
    : [];
};

export const slotChoices = (
  { slot, offset }: SlotAim,
  name: FocusAim['name'] | null,
  disc: DrawnDisc,
): Choice[] =>
  isClearOfDisc(offset, disc)
    ? nameBoxes(name, offset.nx).map((box) =>
        pairChoice(slot, disc, offset, box),
      )
    : [];
