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

  /** On the table, the number goes; the body stays. */
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
