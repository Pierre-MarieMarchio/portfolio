import { panWithin, WHEEL_NOTCH_RATIO, wheelRatio } from './sky-look.rules';

const PIXELS = 0;
const LINES = 1;
const PAGES = 2;
const WIDTH = 1280;

describe('sky look rules', () => {
  it('brings the camera closer by about a tenth for a notch of the wheel rolled away', () => {
    expect(WHEEL_NOTCH_RATIO).toBeCloseTo(1.1, 12);
    expect(wheelRatio(-100, PIXELS)).toBeCloseTo(1.1, 12);
    expect(wheelRatio(100, PIXELS)).toBeCloseTo(1 / 1.1, 12);
  });

  it('reads a notch counted in lines or in pages as the same notch', () => {
    expect(wheelRatio(-3, LINES)).toBeCloseTo(1.1, 12);
    expect(wheelRatio(1, PAGES)).toBeCloseTo(1 / 1.1, 12);
  });

  it('zooms finely for the small deltas of a touchpad', () => {
    const ratio = wheelRatio(-4, PIXELS);

    expect(ratio).toBeGreaterThan(1);
    expect(ratio).toBeLessThan(1.01);
    expect(wheelRatio(-2, PIXELS) ** 2).toBeCloseTo(ratio, 12);
  });

  it('leaves the factor alone when the wheel does not roll up or down', () => {
    expect(wheelRatio(0, PIXELS)).toBe(1);
  });

  it('lets the camera move while the centre of the hole stays in the canvas', () => {
    expect(panWithin(120, 600, WIDTH)).toBe(120);
    expect(panWithin(-120, 600, WIDTH)).toBe(-120);
  });

  it('stops the camera once the centre of the hole reaches an edge', () => {
    expect(panWithin(900, 600, WIDTH)).toBe(WIDTH - 600);
    expect(panWithin(-900, 600, WIDTH)).toBe(-600);
  });

  it('never pushes a hole already past an edge, and leaves it where the zoom put it', () => {
    expect(panWithin(0, -40, WIDTH)).toBe(0);
    expect(panWithin(-30, -40, WIDTH)).toBe(0);
    expect(panWithin(60, -40, WIDTH)).toBe(60);
    expect(panWithin(0, WIDTH + 40, WIDTH)).toBe(0);
    expect(panWithin(30, WIDTH + 40, WIDTH)).toBe(0);
  });
});
