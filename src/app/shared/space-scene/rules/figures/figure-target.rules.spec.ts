import {
  FIGURE_TARGET_MIN,
  figureTargetOf,
  isOverTarget,
  isDraggedClick,
} from './figure-target.rules';

const STAGE = {
  w: 800,
  h: 600,
  dpr: 1,
  zones: [],
  isShown: true,
};

describe('figureTargetOf', () => {
  it('covers the whole box of a figure larger than a finger', () => {
    const target = figureTargetOf({ l: 100, t: 80, r: 220, b: 170 }, STAGE);

    expect(target).toEqual({
      x: 100,
      y: 80,
      width: 120,
      height: 90,
      isInert: false,
    });
  });

  it('grows a small figure to a finger around its centre', () => {
    const target = figureTargetOf({ l: 100, t: 100, r: 120, b: 110 }, STAGE);

    expect(target.width).toBe(FIGURE_TARGET_MIN);
    expect(target.height).toBe(FIGURE_TARGET_MIN);
    expect(target.x + target.width / 2).toBe(110);
    expect(target.y + target.height / 2).toBe(105);
    expect(FIGURE_TARGET_MIN).toBeGreaterThanOrEqual(44);
  });

  it('speaks in page pixels on a dense screen', () => {
    const target = figureTargetOf(
      { l: 200, t: 160, r: 440, b: 340 },
      { ...STAGE, w: 1600, h: 1200, dpr: 2 },
    );

    expect(target).toEqual({
      x: 100,
      y: 80,
      width: 120,
      height: 90,
      isInert: false,
    });
  });

  it('goes inert when the figures are not shown', () => {
    const target = figureTargetOf(
      { l: 100, t: 80, r: 220, b: 170 },
      { ...STAGE, isShown: false },
    );

    expect(target.isInert).toBe(true);
  });

  it('goes inert when the figure is off screen', () => {
    expect(
      figureTargetOf({ l: 760, t: 80, r: 900, b: 170 }, STAGE).isInert,
    ).toBe(true);
    expect(
      figureTargetOf({ l: 100, t: 560, r: 220, b: 700 }, STAGE).isInert,
    ).toBe(true);
  });

  it('goes inert under a glass', () => {
    const glass = { l: 0, t: 400, r: 800, b: 600, o: 1 };

    expect(
      figureTargetOf(
        { l: 100, t: 420, r: 220, b: 500 },
        { ...STAGE, zones: [glass] },
      ).isInert,
    ).toBe(true);
    expect(
      figureTargetOf(
        { l: 100, t: 200, r: 220, b: 300 },
        { ...STAGE, zones: [glass] },
      ).isInert,
    ).toBe(false);
  });

  it('tells a point over a live target, in canvas pixels', () => {
    const target = figureTargetOf(
      { l: 200, t: 160, r: 440, b: 340 },
      { ...STAGE, w: 1600, h: 1200, dpr: 2 },
    );

    expect(isOverTarget(target, { x: 300, y: 200 }, 2)).toBe(true);
    expect(isOverTarget(target, { x: 460, y: 200 }, 2)).toBe(false);
    expect(isOverTarget(target, null, 2)).toBe(false);
    expect(
      isOverTarget({ ...target, isInert: true }, { x: 300, y: 200 }, 2),
    ).toBe(false);
  });
});

describe('isDraggedClick', () => {
  const press = { x: 100, y: 100 };

  it('takes a click that barely moved as a choice of the figure', () => {
    expect(
      isDraggedClick(press, { clientX: 104, clientY: 103, detail: 1 }),
    ).toBe(false);
  });

  it('takes a click that ends a drag of the sky as no choice at all', () => {
    expect(
      isDraggedClick(press, { clientX: 130, clientY: 100, detail: 1 }),
    ).toBe(true);
  });

  it('keeps a keyboard click, which has no press, as a choice', () => {
    expect(isDraggedClick(null, { clientX: 0, clientY: 0, detail: 0 })).toBe(
      false,
    );
  });
});
