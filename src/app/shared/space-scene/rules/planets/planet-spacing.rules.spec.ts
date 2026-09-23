import { PLANET_GAP, repel, ScreenPoint } from './planet-spacing.rules';

const distance = (a: ScreenPoint, b: ScreenPoint): number =>
  Math.hypot(a.sx - b.sx, a.sy - b.sy);

describe('repel', () => {
  it('pulls two merged planets 58 px apart', () => {
    const points = [
      { sx: 100, sy: 100 },
      { sx: 100, sy: 100 },
    ];
    repel(points, 2, PLANET_GAP);
    const [a, b] = points;
    if (!a || !b) {
      throw new Error('expected two points');
    }
    expect(distance(a, b)).toBeGreaterThanOrEqual(PLANET_GAP - 0.001);
  });

  it('leaves points already far enough apart, and points past the count', () => {
    const points = [
      { sx: 0, sy: 0 },
      { sx: 200, sy: 0 },
      { sx: 0, sy: 1 },
    ];
    repel(points, 2, PLANET_GAP);
    expect(points).toEqual([
      { sx: 0, sy: 0 },
      { sx: 200, sy: 0 },
      { sx: 0, sy: 1 },
    ]);
  });

  it('spreads a crowd until no pair is much closer than the gap', () => {
    const points = Array.from({ length: 4 }, (_, i) => ({
      sx: 300 + i * 5,
      sy: 200 + i * 3,
    }));
    repel(points, 4, PLANET_GAP);
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i];
        const b = points[j];
        if (a && b) {
          expect(distance(a, b)).toBeGreaterThan(PLANET_GAP * 0.8);
        }
      }
    }
  });
});
