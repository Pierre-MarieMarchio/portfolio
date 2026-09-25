import { REST_FRAME } from './camera-frames.rules';
import { measureRest } from './rest-frame.rules';

describe('rest frame', () => {
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

    it.each([
      { width: 390, height: 844, rule: 221 },
      { width: 360, height: 780, rule: 221 },
      { width: 320, height: 568, rule: 133 },
    ])(
      'raises an upright phone’s rest, the hole as big as before ($width × $height)',
      ({ width, height, rule }) => {
        const upright = measureRest({ width, height }, 56, rule);

        expect(upright.ev).toBeGreaterThan(REST_FRAME.ev + 0.1);
        expect(upright.s).toBeCloseTo(0.42, 9);
      },
    );

    it('keeps the rest of a screen lying down', () => {
      for (const viewport of [
        { width: 844, height: 390 },
        { width: 1180, height: 820 },
        { width: 1440, height: 900 },
      ]) {
        expect(measureRest(viewport, 56, 90).ev).toBeLessThanOrEqual(
          REST_FRAME.ev,
        );
      }
    });

    it('lays the system down as the free band narrows', () => {
      const tall = measureRest({ width: 1280, height: 1000 }, 72, 56);
      const low = measureRest({ width: 1280, height: 420 }, 72, 56);
      expect(low.ev).toBeLessThan(tall.ev);
      expect(Math.abs(low.i)).toBeLessThan(Math.abs(tall.i));
    });
  });
});
