import type {
  SheetDetent,
  SheetRoom,
  SheetSample,
  SheetStop,
} from '../models/bottom-sheet.model';

const REACH = 48;
const FOLD_REACH = 64;
const FLICK = 0.6;
const SPEED_WINDOW_MS = 80;
const SLACK = 1;

export const isAtStop = (top: number, at: number): boolean =>
  Math.abs(top - at) < SLACK;

export const isFelt = (
  isByUser: boolean,
  from: SheetDetent | null,
  to: SheetDetent,
): boolean => isByUser && from !== null && from !== to;

export const stopsOf = (
  detents: readonly SheetDetent[],
  { peek, half, end }: SheetRoom,
): SheetStop[] => {
  const last = Math.max(end, 0);
  const place: Readonly<Record<SheetDetent, number>> = {
    folded: 0,
    half: Math.min(Math.max(half - peek, 0), last),
    full: last,
  };
  const stops: SheetStop[] = [];
  for (const detent of detents) {
    const stop = { detent, at: place[detent] };
    const previous = stops.at(-1);
    if (previous && isAtStop(previous.at, stop.at)) {
      stops[stops.length - 1] = stop;
    } else if (!previous || stop.at > previous.at) {
      stops.push(stop);
    }
  }
  return stops;
};

export const stopOf = (
  stops: readonly SheetStop[],
  detent: SheetDetent,
): SheetStop | null =>
  stops.find((stop) => stop.detent === detent) ??
  stops.find((stop) => stop.detent === 'full') ??
  stops.at(-1) ??
  null;

const nearestTo = (
  stops: readonly SheetStop[],
  place: number,
): SheetStop | null =>
  stops.reduce<SheetStop | null>(
    (nearest, stop) =>
      !nearest || Math.abs(stop.at - place) < Math.abs(nearest.at - place)
        ? stop
        : nearest,
    null,
  );

const beyond = (
  stops: readonly SheetStop[],
  from: number,
  direction: number,
): SheetStop[] => stops.filter((stop) => (stop.at - from) * direction >= SLACK);

export const detentAfter = (
  from: SheetDetent,
  travel: number,
  vy: number,
  stops: readonly SheetStop[],
): SheetDetent => {
  const origin = stopOf(stops, from);
  if (!origin) {
    return from;
  }
  const place = origin.at + travel;
  if (Math.abs(vy) > FLICK) {
    const direction = Math.sign(vy);
    const ahead = beyond(stops, place, direction);
    const extreme = direction > 0 ? stops.at(-1) : stops[0];
    return (nearestTo(ahead, place) ?? extreme ?? origin).detent;
  }
  const direction = Math.sign(travel);
  const next = nearestTo(beyond(stops, origin.at, direction), place);
  if (!next) {
    return origin.detent;
  }
  const reach = next.detent === 'folded' ? FOLD_REACH : REACH;
  return Math.abs(travel) >= reach ? next.detent : origin.detent;
};

export const speedOf = (
  samples: readonly SheetSample[],
  at: number,
): number => {
  const recent = samples.filter((sample) => at - sample.at <= SPEED_WINDOW_MS);
  const first = recent[0];
  const last = recent.at(-1);
  return first && last && last.at > first.at
    ? (last.top - first.top) / (last.at - first.at)
    : 0;
};

export const shadeFromOf = (stops: readonly SheetStop[]): number | null => {
  const full = stops.findIndex((stop) => stop.detent === 'full');
  const below = stops[full - 1];
  return full > 0 && below?.detent === 'half' ? below.at : null;
};

export const isDismissedBy = (
  stops: readonly SheetStop[],
  origin: SheetDetent,
  top: number,
  pull: number,
): boolean => {
  const lowest = stops[0];
  return (
    lowest !== undefined &&
    lowest.detent === origin &&
    isAtStop(top, lowest.at) &&
    pull >= FOLD_REACH
  );
};
