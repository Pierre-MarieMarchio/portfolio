import { PlanePoint, TurntableMotion } from './turntable.motion';

const at = (angle: number, radius = 1.6): PlanePoint => ({ angle, radius });
const ORBITS = [4.1, 5, 6.9].map((rb) => ({ rb }));

/** Frames at 60 fps, for `ms`, the clock kept by the spec. */
const run = (turntable: TurntableMotion, from: number, ms: number): number => {
  let now = from;
  while (now < from + ms) {
    now += 1000 / 60;
    turntable.step(1 / 60, false, ORBITS);
  }
  return now;
};

describe('Turntable', () => {
  it('takes the disk near the hole, the orbits further out', () => {
    const near = new TurntableMotion();
    near.grab(0, 0, at(0, 1.6), 0);
    near.turn(10, 0, at(0.5, 1.6), 16);

    const far = new TurntableMotion();
    far.grab(0, 0, at(0, 4.5), 0);
    far.turn(10, 0, at(0.5, 4.5), 16);

    expect(near.rotor('disk').angle).toBeCloseTo(0.5, 10);
    expect(near.rotor('orbits').angle).toBe(0);
    expect(far.rotor('orbits').angle).toBeCloseTo(0.5, 10);
    expect(far.rotor('disk').angle).toBe(0);
  });

  it('follows the hand angle for angle, the short way round', () => {
    const turntable = new TurntableMotion();
    turntable.grab(0, 0, at(3), 0);
    turntable.turn(1, 0, at(-3), 16);

    // From 3 to -3 rad is 0.28 rad across ±π, not 6 rad back.
    expect(turntable.rotor('disk').angle).toBeCloseTo(2 * Math.PI - 6, 4);
  });

  it('ignores the angle too near the centre, where it means nothing', () => {
    const turntable = new TurntableMotion();
    turntable.grab(0, 0, at(0, 0.2), 0);
    turntable.turn(10, 0, at(2, 0.2), 16);

    expect(turntable.rotor('disk').angle).toBe(0);
  });

  it('keeps the speed of a throw, and loses it to friction', () => {
    const turntable = new TurntableMotion();
    turntable.grab(0, 0, at(0), 0);
    let now = 0;
    for (let k = 1; k <= 6; k++) {
      now += 16;
      turntable.turn(k * 10, 0, at(k * 0.16), now);
    }
    expect(turntable.release(now + 5)).toBe(true);
    const thrown = turntable.rotor('disk').speed;
    expect(thrown).toBeCloseTo(10, 0);

    run(turntable, now, 1400);
    expect(turntable.rotor('disk').speed).toBeCloseTo(thrown / 2, 0);
  });

  it('throws nothing when the hand had stopped before letting go', () => {
    const turntable = new TurntableMotion();
    turntable.grab(0, 0, at(0), 0);
    turntable.turn(10, 0, at(0.4), 16);

    turntable.release(200);

    expect(turntable.rotor('disk').speed).toBe(0);
  });

  it('calls a gesture under 6 px a click, not a drag', () => {
    const turntable = new TurntableMotion();
    turntable.grab(0, 0, at(0), 0);
    turntable.turn(3, 2, at(0.01), 16);

    expect(turntable.release(20)).toBe(false);
    expect(new TurntableMotion().release(0)).toBe(false);
  });

  /** Dragged, not geared: it follows the driver's slowing, with a lag. */
  it('drags the other turntable after the driver, never ahead of it', () => {
    const turntable = new TurntableMotion();
    turntable.grab(0, 0, at(0), 0);
    let now = 0;
    for (let k = 1; k <= 6; k++) {
      now += 16;
      turntable.turn(k * 10, 0, at(k * 0.16), now);
    }
    turntable.release(now + 5);

    const speeds = [300, 1000, 3000].map((ms) => {
      now = run(turntable, now, ms);
      return {
        disk: turntable.rotor('disk').speed,
        orbits: turntable.rotor('orbits').speed,
      };
    });

    for (const { disk, orbits } of speeds) {
      expect(orbits).toBeGreaterThan(0);
      expect(orbits).toBeLessThan(disk);
    }
  });

  /** By Kepler: the inner orbits take more of the turn, the outer less. */
  it('shares the orbits turn out by Kepler, from the radius taken', () => {
    const turntable = new TurntableMotion();
    turntable.grab(0, 0, at(0, 5), 0);
    turntable.turn(10, 0, at(1, 5), 16);

    turntable.step(1 / 60, false, ORBITS);

    const [inner = 0, taken = 0, outer = 0] = turntable.turns();
    expect(taken).toBeCloseTo(1, 10);
    expect(inner).toBeGreaterThan(taken);
    expect(outer).toBeLessThan(taken);
  });
});
