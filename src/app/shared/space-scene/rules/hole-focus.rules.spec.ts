import type { PanelRect, SceneLayout } from '../models/scene-layout.model';
import { Frame, referenceRadius } from './camera/camera-frames.rules';
import { DISC_REACH, LENS_REACH } from './camera/pointer.rules';
import { FocusAim, HoleFocus, holeInFocus, skyRooms } from './hole-focus.rules';

type Edges = readonly [
  left: number,
  top: number,
  right: number,
  bottom: number,
];

const rect = ([left, top, right, bottom]: Edges): PanelRect => ({
  left,
  top,
  right,
  bottom,
  opacity: 1,
});

const PHONE = { width: 320, height: 568 };
const BAR: Edges = [0, 0, 320, 56];
const TITLE: Edges = [20, 68, 320, 207];
const GLASS_TOP = 312;
const MARGIN = 12;

const layoutOf = (chrome: readonly Edges[], bandTop: number | null) => {
  const layout: SceneLayout = {
    canvas: { left: 0, top: 0 },
    viewport: PHONE,
    panels: chrome.map((box) => rect(box)),
    topBarHeight: 56,
    bottomBarHeight: null,
    approachEdge: null,
    closeUpEdge: null,
    panelBandTop: bandTop,
    chrome: chrome.map((box) => rect(box)),
  };
  return layout;
};

const focusOf = (
  layout: SceneLayout,
  aim: FocusAim | null = null,
  isCloseUp = false,
): HoleFocus => ({
  dims: { w: PHONE.width, h: PHONE.height, dpr: 1 },
  rooms: skyRooms(layout),
  isCloseUp,
  aim,
});

const flat: Frame = { i: 0, s: 0.1, x: 0.5, y: 0.3, ev: 0, az: 0 };

const holeOf = (frame: Frame, shrink = 1) => ({
  x: frame.x * PHONE.width,
  y: frame.y * PHONE.height,
  radius: referenceRadius(PHONE.width, PHONE.height, frame.s) * shrink,
});

describe('holeInFocus', () => {
  it('doubles the hole when the free sky holds its disc', () => {
    const grown = holeInFocus(flat, focusOf(layoutOf([BAR], GLASS_TOP)));

    expect(grown.s).toBeCloseTo(2 * flat.s, 6);
    const hole = holeOf(grown);
    expect(hole.y - LENS_REACH * hole.radius).toBeGreaterThanOrEqual(
      56 + MARGIN,
    );
    expect(hole.y + LENS_REACH * hole.radius).toBeLessThanOrEqual(
      GLASS_TOP - MARGIN,
    );
  });

  it('stops at the largest disc the free sky holds, 12 px from its edges', () => {
    const wide = { ...flat, s: 0.8 };
    const grown = holeInFocus(wide, focusOf(layoutOf([BAR], GLASS_TOP)));
    const hole = holeOf(grown);

    expect(grown.s).toBeGreaterThan(wide.s);
    expect(grown.s).toBeLessThan(2 * wide.s);
    expect(2 * DISC_REACH * hole.radius).toBeCloseTo(
      PHONE.width - 2 * MARGIN,
      3,
    );
  });

  it('never draws a view smaller than it was', () => {
    const large = { ...flat, s: 1.6 };

    expect(holeInFocus(large, focusOf(layoutOf([BAR], GLASS_TOP))).s).toBe(
      large.s,
    );
  });

  it('moves a close-up off the title, its planet and name above the glass', () => {
    const name = { w: 120, h: 18 };
    const aim: FocusAim = {
      angle: 0,
      name,
      offset: (az) => ({ nx: 3.4 * Math.cos(az), ny: 0.4 * Math.sin(az) }),
    };
    const closeUp: Frame = { i: 0, s: 0.74, x: 0.64, y: 0.23, ev: 0, az: 0 };
    const moved = holeInFocus(
      closeUp,
      focusOf(layoutOf([BAR, TITLE], GLASS_TOP), aim, true),
    );
    const hole = holeOf(moved, 0.94);
    const planet = aim.offset(moved.az, moved);
    const planetX = hole.x + planet.nx * hole.radius;
    const planetY = hole.y + planet.ny * hole.radius;

    expect(moved.s).toBeLessThan(closeUp.s);
    expect(hole.y - LENS_REACH * hole.radius).toBeGreaterThanOrEqual(207);
    expect(hole.y + LENS_REACH * hole.radius).toBeLessThanOrEqual(GLASS_TOP);
    expect(planetY + 24).toBeLessThanOrEqual(GLASS_TOP);
    expect(planetX - 24).toBeGreaterThanOrEqual(0);
    expect(planetX + 24).toBeLessThanOrEqual(PHONE.width);
  });
});
