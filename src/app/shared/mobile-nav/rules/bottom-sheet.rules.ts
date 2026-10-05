import type {
  BottomSheetDetent,
  BottomSheetRoom,
  BottomSheetSample,
  BottomSheetStop,
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
  from: BottomSheetDetent | null,
  to: BottomSheetDetent,
): boolean => isByUser && from !== null && from !== to;

export const stopsOf = (
  detents: readonly BottomSheetDetent[],
  { peek, half, end }: BottomSheetRoom,
): BottomSheetStop[] => {
  const last = Math.max(end, 0);
  const place: Readonly<Record<BottomSheetDetent, number>> = {
    folded: 0,
    half: Math.min(Math.max(half - peek, 0), last),
    full: last,
  };
  const stops: BottomSheetStop[] = [];
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
  stops: readonly BottomSheetStop[],
  detent: BottomSheetDetent,
): BottomSheetStop | null =>
  stops.find((stop) => stop.detent === detent) ??
  stops.find((stop) => stop.detent === 'full') ??
  stops.at(-1) ??
  null;

const nearestTo = (
  stops: readonly BottomSheetStop[],
  place: number,
): BottomSheetStop | null =>
  stops.reduce<BottomSheetStop | null>(
    (nearest, stop) =>
      !nearest || Math.abs(stop.at - place) < Math.abs(nearest.at - place)
        ? stop
        : nearest,
    null,
  );

const beyond = (
  stops: readonly BottomSheetStop[],
  from: number,
  direction: number,
): BottomSheetStop[] =>
  stops.filter((stop) => (stop.at - from) * direction >= SLACK);

const draggedTo = (
  stops: readonly BottomSheetStop[],
  origin: BottomSheetStop,
  travel: number,
): BottomSheetDetent => {
  const place = origin.at + travel;
  const next = nearestTo(beyond(stops, origin.at, Math.sign(travel)), place);
  if (!next) {
    return origin.detent;
  }
  const reach = next.detent === 'folded' ? FOLD_REACH : REACH;
  return Math.abs(travel) >= reach ? next.detent : origin.detent;
};

export const detentAfter = (
  from: BottomSheetDetent,
  travel: number,
  vy: number,
  stops: readonly BottomSheetStop[],
): BottomSheetDetent => {
  const origin = stopOf(stops, from);
  if (!origin) {
    return from;
  }
  if (Math.abs(vy) > FLICK) {
    const place = origin.at + travel;
    const direction = Math.sign(vy);
    const ahead = beyond(stops, place, direction);
    const extreme = direction > 0 ? stops.at(-1) : stops[0];
    return (nearestTo(ahead, place) ?? extreme ?? origin).detent;
  }
  return draggedTo(stops, origin, travel);
};

export const speedOf = (
  samples: readonly BottomSheetSample[],
  at: number,
): number => {
  const recent = samples.filter((sample) => at - sample.at <= SPEED_WINDOW_MS);
  const first = recent[0];
  const last = recent.at(-1);
  return first && last && last.at > first.at
    ? (last.top - first.top) / (last.at - first.at)
    : 0;
};

export const shadeFromOf = (
  stops: readonly BottomSheetStop[],
): number | null => {
  const full = stops.findIndex((stop) => stop.detent === 'full');
  const below = stops[full - 1];
  return full > 0 && below?.detent === 'half' ? below.at : null;
};

export const isDismissedBy = (
  stops: readonly BottomSheetStop[],
  origin: BottomSheetDetent,
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
