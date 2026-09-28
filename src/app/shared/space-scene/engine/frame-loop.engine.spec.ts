import { FrameLoopEngine } from './frame-loop.engine';
import { drivenHost } from '@testing/doubles/driven-host.double';

interface Step {
  readonly at: number;
  readonly dt: number;
}

const loopOn = (hz: number, isTouch: boolean) => {
  const display = drivenHost(hz);
  const steps: Step[] = [];
  const loop = new FrameLoopEngine(display.host, (dt) => {
    steps.push({ at: display.host.now(), dt });
    return true;
  });
  loop.setTouch(isTouch);
  loop.setVisible(true);
  return { loop, steps, refresh: display.refresh };
};

const gaps = (steps: readonly Step[]): number[] =>
  steps.slice(1).map((step, i) => step.at - (steps[i]?.at ?? 0));

describe('FrameLoopEngine', () => {
  it('steps one screen refresh in two at 120 Hz under a finger', () => {
    const { steps, refresh } = loopOn(120, true);
    refresh(120);

    expect(steps).toHaveLength(60);
    expect(Math.min(...gaps(steps))).toBeGreaterThanOrEqual(10.5);
  });

  it('keeps the motion on real time: each step covers the whole interval', () => {
    const { steps, refresh } = loopOn(120, true);
    refresh(120);
    const covered = steps.reduce((sum, step) => sum + step.dt, 0);

    for (const step of steps.slice(1)) {
      expect(step.dt).toBeCloseTo(2 / 120, 6);
    }
    expect(covered).toBeCloseTo((steps.at(-1)?.at ?? 0) / 1000, 6);
  });

  it.each([
    { hz: 60, isTouch: true, where: 'under a finger' },
    { hz: 90, isTouch: true, where: 'under a finger' },
    { hz: 120, isTouch: false, where: 'on a desktop' },
  ])('steps every refresh of a $hz Hz screen $where', ({ hz, isTouch }) => {
    const { steps, refresh } = loopOn(hz, isTouch);
    refresh(hz);

    expect(steps).toHaveLength(hz);
  });

  it('does not start in a hidden tab', () => {
    const display = drivenHost();
    const loop = new FrameLoopEngine(
      { ...display.host, hidden: () => true },
      () => true,
    );

    loop.setVisible(true);
    loop.wake();

    expect(display.isScheduled()).toBe(false);
  });

  it('keeps the pace when woken right after a step', () => {
    const display = drivenHost(120);
    const steps: number[] = [];
    let isMoving = false;
    const loop = new FrameLoopEngine(display.host, () => {
      steps.push(display.host.now());
      return isMoving;
    });
    loop.setTouch(true);
    loop.setVisible(true);
    display.refresh(1);
    isMoving = true;
    loop.wake();
    display.refresh(3);

    expect(steps).toHaveLength(2);
    expect((steps[1] ?? 0) - (steps[0] ?? 0)).toBeGreaterThanOrEqual(10.5);
  });
});
