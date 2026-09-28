import { EngineHost, FrameLoopEngine } from './frame-loop.engine';

interface Step {
  readonly at: number;
  readonly dt: number;
}

const screen = (hz: number) => {
  let clock = 0;
  let pending: ((time: number) => void) | null = null;
  const host: EngineHost = {
    frame: (callback) => {
      pending = callback;
      return () => {
        pending = null;
      };
    },
    now: () => clock,
    hidden: () => false,
  };
  const refresh = (frames: number): void => {
    for (let i = 0; i < frames; i++) {
      clock += 1000 / hz;
      const callback = pending;
      pending = null;
      callback?.(clock);
    }
  };
  return { host, refresh, now: () => clock };
};

const loopOn = (hz: number, isTouch: boolean) => {
  const display = screen(hz);
  const steps: Step[] = [];
  const loop = new FrameLoopEngine(display.host, (dt) => {
    steps.push({ at: display.now(), dt });
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

  it('leaves a 60 or a 90 Hz screen alone under a finger', () => {
    const at60 = loopOn(60, true);
    at60.refresh(60);
    const at90 = loopOn(90, true);
    at90.refresh(90);

    expect(at60.steps).toHaveLength(60);
    expect(at90.steps).toHaveLength(90);
  });

  it('steps every refresh of a fast desktop screen', () => {
    const { steps, refresh } = loopOn(120, false);
    refresh(120);

    expect(steps).toHaveLength(120);
  });

  it('keeps the pace when woken right after a step', () => {
    const display = screen(120);
    const steps: number[] = [];
    let isMoving = false;
    const loop = new FrameLoopEngine(display.host, () => {
      steps.push(display.now());
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
