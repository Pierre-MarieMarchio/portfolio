import {
  approachFrame,
  APPROACHES,
  closeUpFrame,
  Frame,
  isFiniteFrame,
  measureRest,
  REST_FRAME,
} from './camera-frames.rules';
import { ARRIVED, traveling } from './traveling.rules';

const growthRate = (t: number): number =>
  (traveling(t + 0.01, false).grow - traveling(t - 0.01, false).grow) / 0.02;

const isFiniteNumbers = (frame: Frame): boolean =>
  Object.values(frame).every((value) => Number.isFinite(value));

describe('scene camera', () => {
  describe('measureRest', () => {
    const viewports = [
      { width: 0, height: 0 },
      { width: 320, height: 240 },
      { width: 924, height: 540 },
      { width: 1280, height: 800 },
      { width: 3840, height: 400 },
      { width: 400, height: 3000 },
    ];

    it('keeps every term finite and inside its bounds, whatever the window', () => {
      for (const viewport of viewports) {
        for (const head of [null, 0, 72, 400]) {
          const m = measureRest(viewport, head, null);
          expect(
            Object.values(m).every((value) => Number.isFinite(value)),
          ).toBe(true);
          expect(m.s).toBeGreaterThanOrEqual(0.07);
          expect(m.s).toBeLessThanOrEqual(0.42);
          expect(m.y).toBeGreaterThanOrEqual(0.14);
          expect(m.y).toBeLessThanOrEqual(0.72);
          expect(m.ev).toBeGreaterThanOrEqual(0.12);
          expect(m.freeHalf).toBeGreaterThanOrEqual(26);
        }
      }
    });

    it('lays the system down as the free band narrows', () => {
      const tall = measureRest({ width: 1280, height: 1000 }, 72, 56);
      const low = measureRest({ width: 1280, height: 420 }, 72, 56);
      expect(low.ev).toBeLessThan(tall.ev);
      expect(Math.abs(low.i)).toBeLessThan(Math.abs(tall.i));
    });
  });

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
              phase: 12.5,
              azim: 7,
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
        phase: 3,
        azim: 40,
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
