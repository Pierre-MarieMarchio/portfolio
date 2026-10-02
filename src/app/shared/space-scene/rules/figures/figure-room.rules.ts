import { DrawnDisc, isBoxOverDisc } from '../camera/pointer.rules';
import type { FigureName } from './figure-label.rules';
import type { SceneLayout } from '../../models/scene-layout.model';
import { freeSkyOf } from '../camera/free-sky.rules';

export interface SkyRoom {
  readonly l: number;
  readonly t: number;
  readonly r: number;
  readonly b: number;
}

const FIGURE_INSET = 8;

export const figureRoomOf = (
  layout: SceneLayout | null,
  width: number,
  dpr: number,
): SkyRoom | null => {
  const sky = width > 0 ? freeSkyOf(layout, width / dpr) : null;
  const inset = FIGURE_INSET * dpr;
  return sky
    ? {
        l: sky.left * dpr + inset,
        t: sky.top * dpr + inset,
        r: sky.right * dpr - inset,
        b: sky.bottom * dpr - inset,
      }
    : null;
};

export interface FigureFit {
  readonly dx: number;
  readonly dy: number;
  readonly name: FigureName;
}

interface FigureSpan {
  readonly l: number;
  readonly t: number;
  readonly r: number;
  readonly b: number;
}

export interface NameSize {
  readonly w: number;
  readonly h: number;
  readonly gap: number;
}

const STAR_REACH = 3;

export const spanOf = (
  points: readonly (readonly [number, number])[],
  dpr: number,
): FigureSpan => {
  const reach = STAR_REACH * dpr;
  return {
    l: Math.min(...points.map((p) => p[0])) - reach,
    t: Math.min(...points.map((p) => p[1])) - reach,
    r: Math.max(...points.map((p) => p[0])) + reach,
    b: Math.max(...points.map((p) => p[1])) + reach,
  };
};

export const nameBoxOf = (name: FigureName, size: NameSize): SkyRoom => ({
  l: name.x,
  r: name.x + size.w,
  t: name.baseline === 'bottom' ? name.y - size.h : name.y,
  b: name.baseline === 'bottom' ? name.y : name.y + size.h,
});

const namesOf = (
  points: readonly (readonly [number, number])[],
  gap: number,
): FigureName[] => {
  const left = Math.min(...points.map((p) => p[0]));
  return [
    {
      x: left,
      y: Math.min(...points.map((p) => p[1])) - gap,
      baseline: 'bottom',
    },
    {
      x: left,
      y: Math.max(...points.map((p) => p[1])) + gap,
      baseline: 'top',
    },
  ];
};

export const unionOf = (a: SkyRoom, b: SkyRoom): SkyRoom => ({
  l: Math.min(a.l, b.l),
  t: Math.min(a.t, b.t),
  r: Math.max(a.r, b.r),
  b: Math.max(a.b, b.b),
});

const intoRoom = (low: number, high: number, from: number, to: number) => {
  if (high - low > to - from || low < from) {
    return from - low;
  }
  return high > to ? to - high : 0;
};

const discBoxOf = (disc: DrawnDisc): SkyRoom => {
  const across = Math.hypot(disc.rx * disc.cos, disc.ry * disc.sin);
  const down = Math.hypot(disc.rx * disc.sin, disc.ry * disc.cos);
  return {
    l: disc.x - across,
    r: disc.x + across,
    t: disc.y - down,
    b: disc.y + down,
  };
};

const isOffDisc = (box: SkyRoom, disc: DrawnDisc | null): boolean =>
  !disc || !isBoxOverDisc(disc, box, 0);

const asidesOf = (disc: DrawnDisc | null, whole: SkyRoom) => {
  if (!disc) {
    return [{ dx: 0, dy: 0 }];
  }
  const box = discBoxOf(disc);
  return [
    { dx: 0, dy: 0 },
    { dx: box.l - whole.r, dy: 0 },
    { dx: box.r - whole.l, dy: 0 },
    { dx: 0, dy: box.t - whole.b },
    { dx: 0, dy: box.b - whole.t },
  ];
};

export const nameInRoom = (
  name: FigureName,
  size: { readonly w: number; readonly h: number },
  room: SkyRoom,
): FigureName => {
  const top = name.baseline === 'bottom' ? size.h : 0;
  const bottom = name.baseline === 'bottom' ? 0 : size.h;
  return {
    ...name,
    x: Math.max(room.l, Math.min(name.x, room.r - size.w)),
    y: Math.max(room.t + top, Math.min(name.y, room.b - bottom)),
  };
};

interface FigureSetting {
  readonly room: SkyRoom;
  readonly disc: DrawnDisc | null;
  readonly name: NameSize;
  readonly dpr: number;
}

const fitBeside = (
  whole: SkyRoom,
  aside: { readonly dx: number; readonly dy: number },
  room: SkyRoom,
  name: FigureName,
): FigureFit => ({
  dx:
    aside.dx + intoRoom(whole.l + aside.dx, whole.r + aside.dx, room.l, room.r),
  dy:
    aside.dy + intoRoom(whole.t + aside.dy, whole.b + aside.dy, room.t, room.b),
  name,
});

const candidateFits = (
  points: readonly (readonly [number, number])[],
  { room, disc, name: size, dpr }: FigureSetting,
): FigureFit[] => {
  const figure = spanOf(points, dpr);
  return namesOf(points, size.gap).flatMap((name) => {
    const whole = unionOf(figure, nameBoxOf(name, size));
    return asidesOf(disc, whole).map((aside) =>
      fitBeside(whole, aside, room, name),
    );
  });
};

const shiftedNameBox = (fit: FigureFit, size: NameSize): SkyRoom => {
  const label = nameBoxOf(fit.name, size);
  return {
    l: label.l + fit.dx,
    r: label.r + fit.dx,
    t: label.t + fit.dy,
    b: label.b + fit.dy,
  };
};

export const figureInRoom = (
  points: readonly (readonly [number, number])[],
  setting: FigureSetting,
): FigureFit => {
  const fits = candidateFits(points, setting);
  const clear = fits.find((fit) =>
    isOffDisc(shiftedNameBox(fit, setting.name), setting.disc),
  );
  return (
    clear ??
    fits[0] ?? { dx: 0, dy: 0, name: { x: 0, y: 0, baseline: 'bottom' } }
  );
};
