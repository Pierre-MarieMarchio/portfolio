import { PlanetHoverMotion } from './planet-hover.motion';
import { FRAME_MS } from '@testing/doubles/driven-host.double';

const ORBIT_SPEED = 0.42;
const STEP = (FRAME_MS / 1000) * ORBIT_SPEED;

const harness = () => {
  const motion = new PlanetHoverMotion();
  let phase = 0;
  const run = (ms: number, hovered: number): void => {
    let elapsed = 0;
    while (elapsed < ms) {
      elapsed += FRAME_MS;
      phase += STEP;
      motion.step(FRAME_MS / 1000, phase, hovered);
    }
  };
  return { run, phaseOf: (i: number) => motion.phaseOf(i, phase) };
};

describe('PlanetHoverMotion', () => {
  it('leaves an orbit never hovered exactly on the shared phase', () => {
    const scene = harness();

    scene.run(2000, -1);

    expect(scene.phaseOf(0)).toBe(scene.phaseOf(1));
  });

  it('slows a hovered orbit to a full stop within about 300 ms', () => {
    const scene = harness();

    scene.run(300, 0);
    const settled = scene.phaseOf(0);
    scene.run(300, 0);

    expect(scene.phaseOf(0)).toBeCloseTo(settled, 2);
  });

  it('keeps the other orbits turning while one is hovered', () => {
    const scene = harness();
    scene.run(600, 0);

    const hovered = scene.phaseOf(0);
    const other = scene.phaseOf(1);

    expect(other).toBeGreaterThan(hovered);
  });

  it('resumes smoothly, without jumping back to the shared phase', () => {
    const scene = harness();
    scene.run(600, 0);
    const hovered = scene.phaseOf(0);

    scene.run(FRAME_MS, -1);
    const justAfter = scene.phaseOf(0);

    expect(justAfter).toBeGreaterThan(hovered);
    expect(justAfter - hovered).toBeLessThan(STEP);
  });

  it('brings a released orbit back to full speed within about 300 ms', () => {
    const scene = harness();
    scene.run(600, 0);
    scene.run(300, -1);
    const before = scene.phaseOf(0);

    scene.run(FRAME_MS, -1);
    const after = scene.phaseOf(0);

    expect(after - before).toBeCloseTo(STEP, 3);
  });
});
