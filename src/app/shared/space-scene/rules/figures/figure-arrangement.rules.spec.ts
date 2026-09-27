import {
  arrangeFigures,
  FigurePlacement,
  placedBox,
} from './figure-arrangement.rules';
import type { SkyRoom } from './figure-room.rules';

const ROOM: SkyRoom = { l: 8, t: 64, r: 382, b: 498 };

const box = (l: number, t: number, w: number, h: number): SkyRoom => ({
  l,
  t,
  r: l + w,
  b: t + h,
});

const isInside = (inner: SkyRoom, outer: SkyRoom): boolean =>
  inner.l >= outer.l - 1e-6 &&
  inner.t >= outer.t - 1e-6 &&
  inner.r <= outer.r + 1e-6 &&
  inner.b <= outer.b + 1e-6;

const isOverlapping = (a: SkyRoom, b: SkyRoom): boolean =>
  a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

const isOverCircle = (
  a: SkyRoom,
  circle: { cx: number; cy: number; radius: number },
): boolean => {
  const x = Math.max(a.l, Math.min(circle.cx, a.r));
  const y = Math.max(a.t, Math.min(circle.cy, a.b));
  return Math.hypot(x - circle.cx, y - circle.cy) < circle.radius;
};

const faultsOf = (
  shapes: readonly SkyRoom[],
  placements: readonly FigurePlacement[],
  room: SkyRoom,
  taken: SkyRoom,
): string[] => {
  const boxes = shapes.map((shape, i) => {
    const placement = placements[i];
    if (!placement) {
      throw new Error(`placement ${String(i)} expected`);
    }
    return placedBox(shape, placement);
  });
  const faults: string[] = [];
  for (const [i, placed] of boxes.entries()) {
    if (!isInside(placed, room)) {
      faults.push(`figure ${String(i)} out of the room`);
    }
    if (isOverlapping(placed, taken)) {
      faults.push(`figure ${String(i)} over the lit figure`);
    }
    for (const [j, other] of boxes.entries()) {
      if (j > i && isOverlapping(placed, other)) {
        faults.push(`figures ${String(i)} and ${String(j)} overlap`);
      }
    }
  }
  return faults;
};

describe('arrangeFigures', () => {
  it('leaves figures that already fit, apart, where they are', () => {
    const shapes = [box(20, 80, 60, 50), box(200, 80, 60, 50)];

    const placements = arrangeFigures(shapes, {
      room: ROOM,
      taken: box(20, 300, 80, 80),
      hole: null,
      disc: null,
      gap: 10,
    });

    expect(placements).toEqual([
      { dx: 0, dy: 0, scale: 1 },
      { dx: 0, dy: 0, scale: 1 },
    ]);
  });

  it('brings the figures under the glass into the room, apart from each other and from the lit one', () => {
    const shapes = [
      box(10, 600, 64, 36),
      box(20, 700, 62, 79),
      box(140, 650, 113, 100),
    ];
    const taken = box(60, 90, 120, 110);

    const placements = arrangeFigures(shapes, {
      room: ROOM,
      taken,
      hole: null,
      disc: null,
      gap: 10,
    });

    expect(faultsOf(shapes, placements, ROOM, taken)).toEqual([]);
  });

  it('keeps their shapes: one scale for all of them, never above one', () => {
    const shapes = [
      box(10, 600, 64, 36),
      box(20, 700, 62, 79),
      box(140, 650, 113, 100),
    ];

    const placements = arrangeFigures(shapes, {
      room: box(8, 64, 200, 200),
      taken: box(8, 64, 80, 80),
      hole: null,
      disc: null,
      gap: 10,
    });
    const scales = new Set(placements.map((placement) => placement.scale));

    expect(scales.size).toBe(1);
    expect([...scales][0]).toBeLessThanOrEqual(1);
  });

  it('shrinks them together when the room is too small for them whole', () => {
    const room = box(8, 64, 160, 160);
    const taken = box(8, 64, 80, 80);
    const shapes = [
      box(10, 600, 64, 36),
      box(20, 700, 62, 79),
      box(140, 650, 113, 100),
    ];

    const placements = arrangeFigures(shapes, {
      room,
      taken,
      hole: null,
      disc: null,
      gap: 10,
    });

    expect(placements[0]?.scale).toBeLessThan(1);
    expect(faultsOf(shapes, placements, room, taken)).toEqual([]);
  });

  it('keeps them out of the shadow of the hole when the room allows it', () => {
    const hole = { cx: 195, cy: 281, radius: 84 };
    const shapes = [
      box(150, 240, 64, 36),
      box(170, 260, 62, 79),
      box(140, 650, 113, 100),
    ];
    const taken = box(20, 70, 90, 110);

    const placements = arrangeFigures(shapes, {
      room: ROOM,
      taken,
      hole,
      disc: null,
      gap: 10,
    });

    expect(faultsOf(shapes, placements, ROOM, taken)).toEqual([]);
    for (const [i, shape] of shapes.entries()) {
      const placement = placements[i];
      expect(placement && isOverCircle(placedBox(shape, placement), hole)).toBe(
        false,
      );
    }
  });

  it('gives the same arrangement for the same sky', () => {
    const shapes = [box(10, 600, 64, 36), box(140, 650, 113, 100)];
    const around = {
      room: ROOM,
      taken: box(60, 90, 120, 110),
      hole: { cx: 195, cy: 281, radius: 84 },
      disc: null,
      gap: 10,
    };

    expect(arrangeFigures(shapes, around)).toEqual(
      arrangeFigures(shapes, around),
    );
  });
});
