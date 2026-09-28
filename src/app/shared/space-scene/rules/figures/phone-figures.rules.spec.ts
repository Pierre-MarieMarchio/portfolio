import { placedBox } from './figure-arrangement.rules';
import {
  figureInRoom,
  nameBoxOf,
  nameInRoom,
  SkyRoom,
  spanOf,
  unionOf,
} from './figure-room.rules';
import { phoneFigureLayout } from './phone-figures.rules';

const ROOM: SkyRoom = { l: 8, t: 64, r: 382, b: 498 };

const isInside = (inner: SkyRoom, outer: SkyRoom): boolean =>
  inner.l >= outer.l - 1e-6 &&
  inner.t >= outer.t - 1e-6 &&
  inner.r <= outer.r + 1e-6 &&
  inner.b <= outer.b + 1e-6;

const isOverlapping = (a: SkyRoom, b: SkyRoom): boolean =>
  a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

const shapeAt = (
  x: number,
  y: number,
  size: number,
): (readonly [number, number])[] => [
  [x, y],
  [x + size, y + size * 0.4],
  [x + size * 0.5, y + size],
];

describe('phoneFigureLayout', () => {
  const figures = [
    shapeAt(120, 150, 90),
    shapeAt(30, 120, 60),
    shapeAt(30, 650, 80),
    shapeAt(140, 640, 110),
  ];
  const name = { w: 70, h: 11, gap: 16 };
  const layout = phoneFigureLayout(figures, {
    room: ROOM,
    disc: null,
    hole: null,
    names: figures.map(() => name),
    dpr: 1,
  });

  it('places each lit figure and its name as the free sky already did', () => {
    for (const [lit, points] of figures.entries()) {
      const fit = figureInRoom(points, {
        room: ROOM,
        disc: null,
        name,
        dpr: 1,
      });

      expect(layout.placements[lit]?.[lit]).toEqual({
        dx: fit.dx,
        dy: fit.dy,
        scale: 1,
      });
      expect(layout.names[lit]).toEqual(
        nameInRoom(
          { ...fit.name, x: fit.name.x + fit.dx, y: fit.name.y + fit.dy },
          name,
          ROOM,
        ),
      );
    }
  });

  it('ranges the three others in the room, apart from the lit one, its name and each other', () => {
    for (const [lit, points] of figures.entries()) {
      const own = layout.placements[lit]?.[lit];
      const litName = layout.names[lit];
      if (!own || !litName) {
        throw new Error(`layout for figure ${String(lit)} expected`);
      }
      const taken = unionOf(
        placedBox(spanOf(points, 1), own),
        nameBoxOf(litName, name),
      );
      const boxes = figures
        .map((shape, k) => {
          const placement = layout.placements[lit]?.[k];
          return placement && k !== lit
            ? placedBox(spanOf(shape, 1), placement)
            : null;
        })
        .filter((placed) => placed !== null);

      expect(boxes).toHaveLength(3);
      for (const [i, placed] of boxes.entries()) {
        expect(isInside(placed, ROOM)).toBe(true);
        expect(isOverlapping(placed, taken)).toBe(false);
        for (const other of boxes.slice(i + 1)) {
          expect(isOverlapping(placed, other)).toBe(false);
        }
      }
    }
  });
});
