import {
  approachFrame,
  APPROACHES,
  closeUpFrame,
  Frame,
  isFiniteFrame,
  REST_FRAME,
} from './camera-frames.rules';
import { ARRIVED, traveling } from './traveling.rules';

const growthRate = (t: number): number =>
  (traveling(t + 0.01, false).grow - traveling(t - 0.01, false).grow) / 0.02;

const noOffset = (): { nx: number; ny: number } => ({ nx: 0, ny: 0 });

const isFiniteNumbers = (frame: Frame): boolean =>
  Object.values(frame).every((value) => Number.isFinite(value));

describe('scene camera', () => {
  describe('approachFrame and closeUpFrame', () => {
    const dims = { w: 1848, h: 1080, dpr: 2 };
    const orbit = { ang: 0.62, v: 0.01, rb: 5.2 };

    it('answers finite framings for every step, measured or not', () => {
      for (const step of APPROACHES.keys()) {
        for (const panelLeft of [null, 0, 400, 5000]) {
          for (const withDims of [dims, null]) {
            const frame = approachFrame({
              step,
              rest: REST_FRAME,
              viewportWidth: 924,
              dims: withDims,
              orbit: withDims ? orbit : null,
              panelLeft,
              band: null,
              phase: 12.5,
              azim: 7,
              offset: noOffset,
            });
            expect(isFiniteNumbers(frame)).toBe(true);
          }
        }
      }
    });

    it('keeps the approach on the camera turn it is on', () => {
      const frame = approachFrame({
        step: 1,
        rest: REST_FRAME,
        viewportWidth: 924,
        dims,
        orbit,
        panelLeft: 407,
        band: null,
        phase: 3,
        azim: 40,
        offset: noOffset,
      });
      expect(Math.abs(frame.az - 40)).toBeLessThanOrEqual(Math.PI);
    });

    it('never frames the close-up smaller than at rest, nor outside its bounds', () => {
      for (const panelLeft of [null, 0, 300, 9000]) {
        const frame = closeUpFrame({
          rest: REST_FRAME,
          dims,
          orbit,
          panelLeft,
          band: null,
          phase: 1,
          azim: 0,
          offset: () => ({ nx: 1e6, ny: -1e6 }),
        });
        expect(isFiniteFrame(frame)).toBe(true);
        expect(frame.s).toBeGreaterThanOrEqual(REST_FRAME.s * 1.25);
        expect(frame.x).toBeLessThanOrEqual(2.2);
        expect(frame.y).toBeGreaterThanOrEqual(-1.2);
      }
    });
  });

  describe('traveling', () => {
    it('animates the distance: a dot for seconds, then it unfolds', () => {
      expect(traveling(0, false).grow).toBeCloseTo(1 / 58, 6);
      expect(traveling(6.5, false).grow).toBeLessThan(0.5);
      expect(traveling(9.6, false).grow).toBeCloseTo(1, 6);
    });

    it('lands instead of braking: the growth dies over more than a second', () => {
      let peak = 0;
      let peakAt = 0;
      for (let t = 6; t <= 9.6; t += 0.01) {
        if (growthRate(t) > peak) {
          peak = growthRate(t);
          peakAt = t;
        }
      }
      let quiet = peakAt;
      while (quiet < 9.6 && growthRate(quiet) > 0.1 * peak) {
        quiet += 0.01;
      }
      expect(quiet - peakAt).toBeGreaterThan(0.9);
    });

    it('keeps the old sizes until the landing', () => {
      expect(traveling(7, false).grow).toBeCloseTo(0.089, 2);
      expect(traveling(8, false).grow).toBeCloseTo(0.467, 2);
    });

    it('never shrinks the object on the way in', () => {
      let last = 0;
      for (let t = 0; t <= 9.7; t += 0.05) {
        const grow = traveling(t, false).grow;
        expect(grow).toBeGreaterThanOrEqual(last);
        last = grow;
      }
    });

    it('lets the matter emerge late: 5% at 5 s, full at 8 s', () => {
      expect(traveling(5, false).matter).toBeCloseTo(0.05, 1);
      expect(traveling(8, false).matter).toBe(1);
    });

    it('sits at its final state with reduced motion, and on a broken clock', () => {
      expect(traveling(0, true)).toBe(ARRIVED);
      expect(
        Object.values(traveling(NaN, false)).every((value) =>
          Number.isFinite(value),
        ),
      ).toBe(true);
    });
  });
});

describe('approachFrame beside a panel on an upright screen', () => {
  const dims = { w: 820, h: 1180, dpr: 1 };
  const orbit = { ang: 0.62, v: 0.01, rb: 5.2 };
  const framed = (step: number, isDiscHeld: boolean): Frame =>
    approachFrame({
      step,
      rest: REST_FRAME,
      viewportWidth: dims.w,
      dims,
      orbit,
      panelLeft: 361,
      band: null,
      isDiscHeld,
      phase: 0,
      azim: 0,
      offset: noOffset,
    });
  const discLeft = (frame: Frame): number =>
    frame.x * dims.w - 2.4 * Math.min(dims.w / 6.6, dims.h / 3.2) * frame.s;

  it('holds the whole disc on screen, at every step', () => {
    expect(
      Math.min(...APPROACHES.map((_, step) => discLeft(framed(step, false)))),
    ).toBeLessThan(12);

    for (const step of APPROACHES.keys()) {
      expect(discLeft(framed(step, true))).toBeGreaterThanOrEqual(12 - 1e-9);
    }
  });

  it('leaves the frame untouched when the disc is already on screen', () => {
    expect(framed(0, true)).toEqual(framed(0, false));
  });
});
