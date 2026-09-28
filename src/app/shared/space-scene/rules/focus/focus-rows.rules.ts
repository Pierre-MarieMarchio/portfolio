import type { DrawnDisc } from '../camera/pointer.rules';
import type { Box } from '../camera/free-sky.rules';
import type { Frame } from '../camera/camera-frames.rules';
import {
  Choice,
  FocusAim,
  Offset,
  reachWithin,
  slotChoices,
  slotOrder,
  SlotAim,
  slotsOf,
  unitDisc,
} from './focus-choices.rules';

const PLACING = {
  growth: 2,
  margin: 12,
  tie: 0.01,
  settle: 0.001,
} as const;

export interface Hole {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export interface Sight {
  readonly looks: readonly (number | boolean | undefined)[];
  readonly rooms: readonly Box[];
  readonly radius: number;
  readonly name: FocusAim['name'] | null;
}

interface Row {
  readonly choice: Choice;
  readonly reaches: Float64Array;
  readonly farthest: number;
  readonly clear: Int8Array;
}

interface SlotSeen {
  readonly offset: Offset;
  readonly rows: readonly Row[];
}

type SlotsSeen = readonly (SlotSeen | undefined)[];

export interface FocusMemo {
  readonly sight: Sight;
  readonly named: SlotsSeen;
  readonly bare: SlotsSeen;
}

export interface Placed {
  readonly choice: Choice;
  readonly room: Box;
  readonly reach: number;
  readonly rank: number;
  readonly distance: number;
}

export interface Placing {
  readonly rooms: readonly Box[];
  readonly distances: Float64Array;
}

export interface AimedPlace {
  readonly place: Placed | null;
  readonly az: number;
  readonly memo: FocusMemo;
}

const rowOf = (choice: Choice, sight: Sight): Row => {
  const inset = 2 * PLACING.margin;
  const reaches = Float64Array.from(sight.rooms, (room) =>
    Math.min(
      PLACING.growth * sight.radius,
      reachWithin(choice.across, room.right - room.left - inset),
      reachWithin(choice.down, room.bottom - room.top - inset),
    ),
  );
  return {
    choice,
    reaches,
    farthest: Math.max(0, ...reaches),
    clear: new Int8Array(reaches.length),
  };
};

const isClearAt = (row: Row, index: number, reach: number): boolean => {
  if (row.clear[index] === 0) {
    row.clear[index] = row.choice.isNameClear(reach) ? 1 : -1;
  }
  return row.clear[index] === 1;
};

export const placingOf = (rooms: readonly Box[], hole: Hole): Placing => ({
  rooms,
  distances: Float64Array.from(rooms, (room) =>
    Math.hypot(
      (room.left + room.right) / 2 - hole.x,
      (room.top + room.bottom) / 2 - hole.y,
    ),
  ),
});

const isSettled = (a: number, b: number, scale = 1): boolean =>
  Math.abs(a - b) * scale <= PLACING.settle;

const isSameOffset = (a: Offset, b: Offset, radius: number): boolean =>
  isSettled(a.nx, b.nx, radius) && isSettled(a.ny, b.ny, radius);

const seenSlots = (
  slots: readonly SlotAim[],
  last: SlotsSeen,
  sight: Sight,
  disc: DrawnDisc,
): SlotSeen[] =>
  slots.map((aimed) => {
    const kept = last[aimed.slot];
    return kept && isSameOffset(kept.offset, aimed.offset, sight.radius)
      ? kept
      : {
          offset: aimed.offset,
          rows: slotChoices(aimed, sight.name, disc).map((choice) =>
            rowOf(choice, sight),
          ),
        };
  });

const isBetter = (
  reach: number,
  rank: number,
  distance: number,
  best: Placed | null,
): boolean =>
  !best ||
  reach > best.reach + PLACING.tie ||
  (reach >= best.reach - PLACING.tie &&
    (rank < best.rank || (rank === best.rank && distance < best.distance)));

const bestInRow = (
  row: Row,
  rank: number,
  { rooms, distances }: Placing,
  best: Placed | null,
): Placed | null => {
  let kept = best;
  for (const [index, room] of rooms.entries()) {
    const reach = row.reaches[index] ?? 0;
    const distance = distances[index] ?? Infinity;
    if (isBetter(reach, rank, distance, kept) && isClearAt(row, index, reach)) {
      kept = { choice: row.choice, room, reach, rank, distance };
    }
  }
  return kept;
};

const bestPlace = (rows: readonly Row[], placing: Placing): Placed | null => {
  let best: Placed | null = null;
  for (const [rank, row] of rows.entries()) {
    const canWin: boolean = !best || row.farthest > best.reach + PLACING.tie;
    best = canWin ? bestInRow(row, rank, placing, best) : best;
  }
  return best && best.reach > 0 ? best : null;
};

export const discPlace = (
  choice: Choice,
  sight: Sight,
  placing: Placing,
): Placed | null => bestPlace([rowOf(choice, sight)], placing);

const orderedRows = (order: readonly SlotAim[], seen: SlotsSeen): Row[] =>
  order.flatMap(({ slot }) => seen[slot]?.rows ?? []);

const isSameSight = (next: Sight, last: Sight): boolean =>
  next.rooms === last.rooms &&
  isSettled(next.radius, last.radius) &&
  next.looks.every((look, k) => look === last.looks[k]);

const azOf = (
  place: Placed | null,
  slots: readonly SlotAim[],
  frame: Frame,
): number => (place && slots[place.choice.slot]?.az) ?? frame.az;

export const aimedPlace = (
  { frame, aim, sight }: { frame: Frame; aim: FocusAim; sight: Sight },
  placing: Placing,
  memo: FocusMemo | null,
): AimedPlace => {
  const kept =
    memo && isSameSight(sight, memo.sight)
      ? memo
      : { sight, named: [], bare: [] };
  const disc = unitDisc(frame);
  const slots = slotsOf(frame, aim);
  const order = slotOrder(slots);
  const named = seenSlots(slots, kept.named, sight, disc);
  const namedPlace = bestPlace(orderedRows(order, named), placing);
  const bare = namedPlace
    ? kept.bare
    : seenSlots(slots, kept.bare, { ...sight, name: null }, disc);
  const place = namedPlace ?? bestPlace(orderedRows(order, bare), placing);
  return {
    place,
    az: azOf(place, slots, frame),
    memo: { sight: kept.sight, named, bare },
  };
};
