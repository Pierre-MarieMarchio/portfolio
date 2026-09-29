import type {
  FrameArea,
  FrameEdge,
  FrameRect,
} from '../models/window-frame.model';
import {
  areaOf,
  cascadePlaceOf,
  clampMove,
  clampResize,
  clearanceOf,
  fitBelowFloor,
  frameOfZone,
  isZone,
  leastOverlapPlaceOf,
  snapZoneOf,
  unsnapAt,
} from './window-frame.rules';

const VIEWPORT = { width: 1200, height: 800 };
const AREA: FrameArea = { left: 44, top: 100, right: 1156, bottom: 724 };
const FRAME: FrameRect = { x: 756, y: 100, width: 400, height: 300 };
const CLEARANCE = { top: 12, bottom: 60 };
const FLOOR = AREA.bottom;
const BOUNDS = { ...CLEARANCE, floor: FLOOR };

describe('window frame rules', () => {
  describe('clampMove', () => {
    it.each([
      ['a frame within the screen', [500, 300], [500, 300]],
      ['past the left edge, 150 px still showing', [-900, 300], [-234, 300]],
      ['past the right edge, 150 px still showing', [1900, 300], [1050, 300]],
      ['above the top, its bar under the edge', [500, -40], [500, 12]],
      ['below the bottom, its bar still on screen', [500, 1000], [500, 740]],
      ['to whole pixels', [500.4, 300.6], [500, 301]],
    ] as const)('keeps %s', (_case, [x, y], [keptX, keptY]) => {
      expect(clampMove({ ...FRAME, x, y }, VIEWPORT, CLEARANCE)).toEqual({
        ...FRAME,
        x: keptX,
        y: keptY,
      });
    });

    it('reads its clearance from the caller rather than a fixed margin', () => {
      expect(
        clampMove({ ...FRAME, y: -900 }, VIEWPORT, { top: 400, bottom: 60 }),
      ).toEqual({ ...FRAME, y: 400 });
      expect(
        clampMove({ ...FRAME, y: 2000 }, VIEWPORT, { top: 12, bottom: 300 }),
      ).toEqual({ ...FRAME, y: 500 });
    });
  });

  describe('clampResize', () => {
    it.each<[string, FrameEdge, { dx: number; dy: number }, FrameRect]>([
      [
        'grows from its bottom edge',
        's',
        { dx: 0, dy: 120 },
        { ...FRAME, height: 420 },
      ],
      [
        'grows from its left edge, its right edge fixed',
        'w',
        { dx: -100, dy: 0 },
        { ...FRAME, x: 656, width: 500 },
      ],
      [
        'grows from its bottom-left corner',
        'sw',
        { dx: -100, dy: 100 },
        { x: 656, y: 100, width: 500, height: 400 },
      ],
      [
        'shrinks from its right edge',
        'e',
        { dx: -60, dy: 0 },
        { ...FRAME, width: 340 },
      ],
      ['keeps its right edge within the area', 'se', { dx: 200, dy: 0 }, FRAME],
      [
        'never goes under 320 × 200',
        'sw',
        { dx: 300, dy: -250 },
        { x: 836, y: 100, width: 320, height: 200 },
      ],
      [
        'never goes over the area',
        'sw',
        { dx: -2000, dy: 2000 },
        { x: 44, y: 100, width: 1112, height: 624 },
      ],
    ])('%s', (_case, edge, delta, resized) => {
      expect(clampResize(FRAME, edge, delta, AREA)).toEqual(resized);
    });

    it('leaves an edge already past the area where it is', () => {
      const past = { ...FRAME, x: 900 };

      expect(clampResize(past, 'e', { dx: 0, dy: 0 }, AREA).width).toBe(400);
    });
  });

  describe('snapZoneOf', () => {
    it.each([
      ['the left edge', 0, 400, 'left'],
      ['near the left edge', 12, 400, 'left'],
      ['the right edge', 1199, 400, 'right'],
      ['the top edge', 600, 0, 'full'],
      ['the top-left corner, a side and no quarter', 4, 4, 'left'],
      ['the top-right corner, a side and no quarter', 1196, 4, 'right'],
      ['the middle of the screen', 600, 400, null],
      ['just off the left edge', 13, 400, null],
    ])('reads %s', (_case, x, y, zone) => {
      expect(snapZoneOf(x, y, VIEWPORT)).toBe(zone);
    });
  });

  describe('isZone', () => {
    it.each([
      ['left', true],
      ['right', true],
      ['full', true],
      ['free', false],
      [null, false],
    ] as const)('says whether %s is a zone of the screen', (mode, isOne) => {
      expect(isZone(mode)).toBe(isOne);
    });
  });

  describe('frameOfZone', () => {
    it.each([
      ['full', { x: 44, y: 100, width: 1112, height: 624 }],
      ['left', { x: 44, y: 100, width: 550, height: 624 }],
      ['right', { x: 606, y: 100, width: 550, height: 624 }],
    ] as const)('frames the %s zone within the area', (zone, frame) => {
      expect(frameOfZone(zone, AREA)).toEqual(frame);
    });

    it('keeps a half at 320 px on a narrow screen', () => {
      const narrow = { ...AREA, right: 544 };

      expect(frameOfZone('right', narrow)).toEqual({
        x: 224,
        y: 100,
        width: 320,
        height: 624,
      });
    });
  });

  describe('areaOf', () => {
    const layout = { left: 756, top: 100, right: 1156, bottom: 400 };

    it.each([
      ['top', AREA],
      ['bottom', { left: 44, top: 76, right: 1156, bottom: 400 }],
    ] as const)(
      'spans the screen from the gutter, the reserve opposite a %s anchor',
      (anchor, area) => {
        expect(areaOf(layout, anchor, VIEWPORT, 76)).toEqual(area);
      },
    );
  });

  describe('clearanceOf', () => {
    it('keeps a gap under the top bar, and above the bottom reserve plus the title bar', () => {
      expect(clearanceOf(400, 76, 48)).toEqual({ top: 412, bottom: 124 });
    });

    it('falls back to no head bar and no bar height', () => {
      expect(clearanceOf(0, 76, 0)).toEqual({ top: 12, bottom: 76 });
    });
  });

  describe('cascadePlaceOf', () => {
    const OWN: FrameRect = { x: 800, y: 100, width: 400, height: 300 };

    it('offsets 32 px left and 32 px down from the corner of the window above', () => {
      expect(cascadePlaceOf(OWN, OWN, VIEWPORT, BOUNDS)).toEqual({
        dx: -32,
        dy: 32,
        width: null,
        height: null,
      });
    });

    it('is not thrown off by a fractional layout position', () => {
      const top: FrameRect = { x: 800, y: 94.5, width: 400, height: 300 };
      const own: FrameRect = { x: 768, y: 94.5, width: 400, height: 300 };

      expect(cascadePlaceOf(top, own, VIEWPORT, BOUNDS)).toEqual({
        dx: 0,
        dy: 33,
        width: null,
        height: null,
      });
    });

    it('reads the offset from the window above, wherever it sits and whatever its size', () => {
      const top: FrameRect = { x: 500, y: 200, width: 300, height: 250 };

      expect(cascadePlaceOf(top, OWN, VIEWPORT, BOUNDS)).toEqual({
        dx: 500 + 300 - 32 - 400 - 800,
        dy: 200 + 32 - 100,
        width: null,
        height: null,
      });
    });

    it('gives up and lets the window keep its default place once the offset goes off screen', () => {
      const top: FrameRect = { ...OWN, x: 1150 };

      expect(cascadePlaceOf(top, OWN, VIEWPORT, BOUNDS)).toBeNull();
    });

    it('gives up once the offset leaves its title bar unreachable', () => {
      const top: FrameRect = { ...OWN, y: VIEWPORT.height - CLEARANCE.bottom };

      expect(cascadePlaceOf(top, OWN, VIEWPORT, BOUNDS)).toBeNull();
    });

    it('reduces its height to stay above the floor, the body free to scroll inside', () => {
      const top: FrameRect = { ...OWN, y: 450 };

      expect(cascadePlaceOf(top, OWN, VIEWPORT, BOUNDS)).toEqual({
        dx: -32,
        dy: 382,
        width: null,
        height: FLOOR - 482,
      });
    });

    it('gives up once even the minimum height would not fit above the floor', () => {
      const top: FrameRect = { ...OWN, y: 600 };

      expect(cascadePlaceOf(top, OWN, VIEWPORT, BOUNDS)).toBeNull();
    });
  });

  describe('leastOverlapPlaceOf', () => {
    const OWN: FrameRect = { x: 800, y: 100, width: 400, height: 300 };
    const MIRROR: FrameRect = { x: 0, y: 100, width: 400, height: 300 };

    it('moves to the mirrored left when it clears the window already there entirely', () => {
      expect(leastOverlapPlaceOf(OWN, [OWN], VIEWPORT, BOUNDS)).toEqual({
        dx: -800,
        dy: 0,
        width: null,
        height: null,
      });
    });

    it('is not thrown off by a fractional layout position', () => {
      const own: FrameRect = { ...OWN, y: 100.5 };

      expect(leastOverlapPlaceOf(own, [own], VIEWPORT, BOUNDS)).toEqual({
        dx: -800,
        dy: 0.5,
        width: null,
        height: null,
      });
    });

    it('keeps the default place when there is nothing else shown', () => {
      expect(leastOverlapPlaceOf(OWN, [], VIEWPORT, BOUNDS)).toBeNull();
    });

    it('prefers the default place when every reachable candidate clears the overlap equally', () => {
      const front: FrameRect = { ...OWN, x: -1000 };

      expect(leastOverlapPlaceOf(OWN, [front], VIEWPORT, BOUNDS)).toBeNull();
    });

    it('keeps the default place when the mirrored side is worse and the cascade is not reachable', () => {
      const front: FrameRect = { ...OWN, x: 1150 };

      expect(
        leastOverlapPlaceOf(OWN, [front, MIRROR], VIEWPORT, BOUNDS),
      ).toBeNull();
    });

    it('falls back to the cascade once the default and the mirrored side are both already taken', () => {
      expect(leastOverlapPlaceOf(OWN, [OWN, MIRROR], VIEWPORT, BOUNDS)).toEqual(
        { dx: -32, dy: 32, width: null, height: null },
      );
    });

    it('keeps the default place once even the cascade would leave it covered more', () => {
      const wide: FrameRect = { x: 100, y: 100, width: 1000, height: 300 };

      expect(leastOverlapPlaceOf(OWN, [wide], VIEWPORT, BOUNDS)).toBeNull();
    });
  });

  describe('fitBelowFloor', () => {
    const RECT: FrameRect = { x: 100, y: 300, width: 400, height: 300 };

    it('keeps a rect that already fits above the floor', () => {
      expect(fitBelowFloor(RECT, 700)).toBe(RECT);
    });

    it('shrinks a rect that would cross the floor', () => {
      expect(fitBelowFloor(RECT, 500)).toEqual({ ...RECT, height: 200 });
    });

    it('gives up once the minimum height would still cross the floor', () => {
      expect(fitBelowFloor(RECT, 450)).toBeNull();
    });
  });

  describe('unsnapAt', () => {
    it.each([
      ['keeps the pointer at the same share of the width', 600, 400],
      ['keeps a frame grabbed at its left edge there', 44, 44],
    ])('%s', (_case, pointerX, restoredX) => {
      expect(
        unsnapAt({ x: 44, y: 100, width: 1112, height: 624 }, 400, pointerX),
      ).toBe(restoredX);
    });
  });
});
