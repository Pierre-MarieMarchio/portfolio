import type { SceneLayout } from '../models/scene-layout.model';
import { Frame } from './camera/camera-frames.rules';
import { DISC_REACH, LENS_REACH } from './camera/pointer.rules';
import {
  FocusAim,
  HoleFocus,
  holeInFocus as focusedOf,
  skyRooms,
} from './hole-focus.rules';
import {
  chromeLayout,
  Edges,
  holeOf,
  UPRIGHT_PHONE,
  UPRIGHT_BAR,
  UPRIGHT_TITLE,
} from '@testing/fixtures/scene-layout.fixture';

const holeInFocus = (frame: Frame, focus: HoleFocus): Frame =>
  focusedOf(frame, focus).frame;

const GLASS_TOP = 312;
const MARGIN = 12;

const layoutOf = (chrome: readonly Edges[], bandTop: number | null) =>
  chromeLayout(UPRIGHT_PHONE, chrome, { panelBandTop: bandTop });

const focusOf = (
  layout: SceneLayout,
  aim: FocusAim | null = null,
  isCloseUp = false,
): HoleFocus => ({
  dims: { w: UPRIGHT_PHONE.width, h: UPRIGHT_PHONE.height, dpr: 1 },
  rooms: skyRooms(layout),
  isCloseUp,
  aim,
});

const flat: Frame = { i: 0, s: 0.1, x: 0.5, y: 0.3, ev: 0, az: 0 };

describe('holeInFocus', () => {
  it('doubles the hole when the free sky holds its disc', () => {
    const grown = holeInFocus(
      flat,
      focusOf(layoutOf([UPRIGHT_BAR], GLASS_TOP)),
    );

    expect(grown.s).toBeCloseTo(2 * flat.s, 6);
    const hole = holeOf(grown, UPRIGHT_PHONE);
    expect(hole.y - LENS_REACH * hole.radius).toBeGreaterThanOrEqual(
      56 + MARGIN,
    );
    expect(hole.y + LENS_REACH * hole.radius).toBeLessThanOrEqual(
      GLASS_TOP - MARGIN,
    );
  });

  it('stops at the largest disc the free sky holds, 12 px from its edges', () => {
    const wide = { ...flat, s: 0.8 };
    const grown = holeInFocus(
      wide,
      focusOf(layoutOf([UPRIGHT_BAR], GLASS_TOP)),
    );
    const hole = holeOf(grown, UPRIGHT_PHONE);

    expect(grown.s).toBeGreaterThan(wide.s);
    expect(grown.s).toBeLessThan(2 * wide.s);
    expect(2 * DISC_REACH * hole.radius).toBeCloseTo(
      UPRIGHT_PHONE.width - 2 * MARGIN,
      3,
    );
  });

  it('never draws a view smaller than it was', () => {
    const large = { ...flat, s: 1.6 };

    expect(
      holeInFocus(large, focusOf(layoutOf([UPRIGHT_BAR], GLASS_TOP))).s,
    ).toBe(large.s);
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
      focusOf(layoutOf([UPRIGHT_BAR, UPRIGHT_TITLE], GLASS_TOP), aim, true),
    );
    const hole = holeOf(moved, UPRIGHT_PHONE, 0.94);
    const planet = aim.offset(moved.az, moved);
    const planetX = hole.x + planet.nx * hole.radius;
    const planetY = hole.y + planet.ny * hole.radius;

    expect(moved.s).toBeLessThan(closeUp.s);
    expect(hole.y - LENS_REACH * hole.radius).toBeGreaterThanOrEqual(207);
    expect(hole.y + LENS_REACH * hole.radius).toBeLessThanOrEqual(GLASS_TOP);
    expect(planetY + 24).toBeLessThanOrEqual(GLASS_TOP);
    expect(planetX - 24).toBeGreaterThanOrEqual(0);
    expect(planetX + 24).toBeLessThanOrEqual(UPRIGHT_PHONE.width);
  });
});

describe('holeInFocus, frame after frame', () => {
  const name = { w: 120, h: 18 };
  const rest: Frame = { i: -0.33, s: 0.3, x: 0.53, y: 0.4, ev: 0.18, az: 0 };
  const layout = layoutOf([UPRIGHT_BAR, UPRIGHT_TITLE], GLASS_TOP);
  const rooms = skyRooms(layout);

  const orbiting = (angle: number, reach = 3.4): FocusAim => ({
    angle,
    name,
    offset: (az) => ({
      nx: reach * Math.cos(angle + az),
      ny: 0.4 * Math.sin(angle + az),
    }),
  });

  const focusAt = (aim: FocusAim): HoleFocus => ({
    ...focusOf(layout, aim),
    rooms,
  });

  it('frames as a fresh search would, all along an orbit', () => {
    let memo = focusedOf(rest, focusAt(orbiting(0))).memo;
    let worst = 0;
    let turns = 0;
    let lastAz = rest.az;
    for (let step = 1; step <= 1260; step += 1) {
      const aim = orbiting(step * 0.005);
      const drifting = { ...rest, y: rest.y + step * 2e-5 };
      const kept = focusedOf(drifting, focusAt(aim), memo);
      const fresh = holeInFocus(drifting, focusAt(aim));
      memo = kept.memo;
      turns += Math.abs(fresh.az - lastAz) > 0.1 ? 1 : 0;
      lastAz = fresh.az;
      const keptHole = holeOf(kept.frame, UPRIGHT_PHONE);
      const freshHole = holeOf(fresh, UPRIGHT_PHONE);
      worst = Math.max(
        worst,
        Math.abs(keptHole.x - freshHole.x),
        Math.abs(keptHole.y - freshHole.y),
        Math.abs(keptHole.radius - freshHole.radius),
        Math.abs(kept.frame.az - fresh.az),
      );
    }

    expect(turns).toBeGreaterThan(0);
    expect(worst).toBeLessThan(0.01);
  });

  it('keeps the placements that do not follow the planet while it orbits', () => {
    const first = focusedOf(rest, focusAt(orbiting(0)));

    const next = focusedOf(rest, focusAt(orbiting(0.01)), first.memo);

    expect(next.memo?.named[1]).toBe(first.memo?.named[1]);
    expect(next.memo?.named[0]).not.toBe(first.memo?.named[0]);
  });

  it('places again what the orbit itself changes', () => {
    const first = focusedOf(rest, focusAt(orbiting(0)));
    const aim = orbiting(0.01, 3.1);

    const next = focusedOf(rest, focusAt(aim), first.memo);

    expect(next.memo?.named[1]).not.toBe(first.memo?.named[1]);
    expect(next.frame).toEqual(holeInFocus(rest, focusAt(aim)));
  });

  it('places everything again when the sky changes', () => {
    const first = focusedOf(rest, focusAt(orbiting(0)));
    const other = {
      ...focusAt(orbiting(0)),
      rooms: skyRooms(layoutOf([UPRIGHT_BAR], 400)),
    };

    const next = focusedOf(rest, other, first.memo);

    expect(next.memo?.named[1]).not.toBe(first.memo?.named[1]);
    expect(next.frame).toEqual(holeInFocus(rest, other));
  });
});
