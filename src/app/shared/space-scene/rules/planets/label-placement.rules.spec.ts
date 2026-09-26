import { placeName, placeTag, TakenPlace } from './label-placement.rules';

const STAGE = { w: 1280, h: 800 };
const SIZE = { w: 120, h: 20 };

const planet = (x: number, y: number, isNamed = true) => ({
  x,
  y,
  radius: 4,
  objectRadius: 300,
  dpr: 1,
  named: isNamed,
});

describe('placeTag', () => {
  it('sets the number right against its body, above and to the right', () => {
    const at = placeTag(
      { x: 600, y: 400, gap: 10 },
      { w: 20, h: 16 },
      STAGE,
      [],
    );

    expect(at).toEqual({ x: 610, y: 379, onText: false });
  });

  it('keeps it on the stage at the edges', () => {
    const at = placeTag(
      { x: 1275, y: 5, gap: 10 },
      { w: 20, h: 16 },
      STAGE,
      [],
    );

    expect(at.x).toBe(1280 - 20 - 2);
    expect(at.y).toBe(2);
  });

  it('says so when it falls on a text panel', () => {
    const at = placeTag({ x: 600, y: 400, gap: 10 }, { w: 20, h: 16 }, STAGE, [
      { l: 580, r: 700, t: 350, b: 450 },
    ]);

    expect(at.onText).toBe(true);
  });
});

describe('placeName', () => {
  it('leads the name towards the outside of the frame', () => {
    const right = placeName(planet(900, 300), SIZE, STAGE, []);
    const left = placeName(planet(300, 300), SIZE, STAGE, []);

    expect(right.dir).toBe(1);
    expect(right.x).toBeGreaterThan(900);
    expect(left.dir).toBe(-1);
    expect(left.x + SIZE.w).toBeLessThan(300);
  });

  it('rises above the middle, falls below it', () => {
    expect(placeName(planet(900, 300), SIZE, STAGE, []).y).toBeLessThan(300);
    expect(placeName(planet(900, 500), SIZE, STAGE, []).y).toBeGreaterThan(500);
  });

  it('takes its place, so the next name avoids it', () => {
    const taken: TakenPlace[] = [];
    const first = placeName(planet(900, 300), SIZE, STAGE, taken);
    const second = placeName(planet(900, 300), SIZE, STAGE, taken);

    expect(taken).toHaveLength(2);
    expect(second.free).toBe(true);
    expect([second.x, second.y]).not.toEqual([first.x, first.y]);
  });

  it('tries the other flank before giving up', () => {
    const own = placeName(planet(900, 300), SIZE, STAGE, []);
    const taken: TakenPlace[] = [-4, -3, -2, -1, 0, 1, 2, 3, 4].map((k) => ({
      x: own.x,
      y: own.y + k * 28,
      w: 400,
      h: 28,
    }));

    const moved = placeName(planet(900, 300), SIZE, STAGE, taken);

    expect(moved.free).toBe(true);
    expect(moved.dir).toBe(-1);
  });

  it('keeps a name clear of a longer one it would start inside', () => {
    const near = { ...planet(900, 300), objectRadius: 40 };
    const own = placeName(near, SIZE, STAGE, []);
    const longer = SIZE.w + 30;
    const before: TakenPlace = {
      x: own.x - longer + 9,
      y: own.y,
      w: longer,
      h: SIZE.h,
      isName: true,
    };

    const placed = placeName(near, SIZE, STAGE, [before]);

    const isApart =
      placed.x >= before.x + before.w ||
      placed.x + SIZE.w <= before.x ||
      Math.abs(placed.y - before.y) >= (before.h + SIZE.h) / 2;
    expect(isApart).toBe(true);
  });

  it('gives up when both flanks are taken, and takes nothing', () => {
    const taken: TakenPlace[] = [{ x: 640, y: 400, w: 4000, h: 4000 }];

    const lost = placeName(planet(900, 300), SIZE, STAGE, taken);

    expect(lost.free).toBe(false);
    expect(taken).toHaveLength(1);
  });

  it('places an unnamed body without searching or taking a place', () => {
    const taken: TakenPlace[] = [{ x: 0, y: 0, w: 4000, h: 4000 }];

    const unnamed = placeName(planet(900, 300, false), SIZE, STAGE, taken);

    expect(unnamed.free).toBe(true);
    expect(taken).toHaveLength(1);
  });
});

describe('placeName, beside the hole', () => {
  const HOLE = { x: 400, y: 400, radius: 60 };
  const isCrossing = (at: { x: number; y: number }): boolean => {
    const dx = HOLE.x - Math.min(Math.max(HOLE.x, at.x), at.x + SIZE.w);
    const dy =
      HOLE.y - Math.min(Math.max(HOLE.y, at.y - SIZE.h / 2), at.y + SIZE.h / 2);
    return Math.hypot(dx, dy) < HOLE.radius;
  };

  it('keeps a name off the disc of the hole', () => {
    const inward = { ...planet(460, 395), objectRadius: 40 };
    expect(isCrossing(placeName(inward, SIZE, STAGE, []))).toBe(true);

    const placed = placeName(inward, SIZE, { ...STAGE, hole: HOLE }, []);

    expect(placed.free).toBe(true);
    expect(isCrossing(placed)).toBe(false);
  });
});

const boxOf = (at: { x: number; y: number }) => ({
  l: at.x,
  r: at.x + SIZE.w,
  t: at.y - SIZE.h / 2,
  b: at.y + SIZE.h / 2,
});

const walls = (): TakenPlace[] => [
  { x: 0, y: 100, w: 4000, h: 100 },
  { x: 0, y: 285, w: 4000, h: 40 },
];

describe('placeName, on a touch screen', () => {
  const DISC = { x: 400, y: 400, rx: 150, ry: 40, cos: 1, sin: 0 };
  const isInDisc = (at: { x: number; y: number }): boolean => {
    const edges = boxOf(at);
    const dx = Math.min(Math.max(DISC.x, edges.l), edges.r) - DISC.x;
    const dy = Math.min(Math.max(DISC.y, edges.t), edges.b) - DISC.y;
    return (dx / DISC.rx) ** 2 + (dy / DISC.ry) ** 2 < 1;
  };

  it('keeps a name off the drawn disc, not only off the hole', () => {
    const inward = { ...planet(470, 410), objectRadius: 40 };
    expect(isInDisc(placeName(inward, SIZE, STAGE, []))).toBe(true);

    const placed = placeName(inward, SIZE, { ...STAGE, disc: DISC }, []);

    expect(placed.free).toBe(true);
    expect(isInDisc(placed)).toBe(false);
  });

  it('keeps a name off the button of another planet, not its own', () => {
    const own = { ...planet(900, 300), rank: 0 };
    const first = placeName(own, SIZE, STAGE, []);
    const other = { x: first.x + 40, y: first.y };
    const isOverOther = (at: { x: number; y: number }): boolean => {
      const edges = boxOf(at);
      return (
        edges.l < other.x + 24 &&
        edges.r > other.x - 24 &&
        edges.t < other.y + 24 &&
        edges.b > other.y - 24
      );
    };
    const bodies = [{ x: 900, y: 300 }, other];

    const placed = placeName(own, SIZE, { ...STAGE, bodies }, []);

    expect(isOverOther(first)).toBe(true);
    expect(placed.free).toBe(true);
    expect(isOverOther(placed)).toBe(false);
  });

  it('finds the narrow row just clear of a cluster of buttons', () => {
    const stage = { w: 320, h: 400 };
    const bodies = [
      { x: 110, y: 200 },
      { x: 200, y: 210 },
    ];
    const own = { ...planet(110, 200), rank: 0 };
    const placed = placeName(own, SIZE, { ...stage, bodies }, walls());

    expect(placed.free).toBe(true);
  });
});
