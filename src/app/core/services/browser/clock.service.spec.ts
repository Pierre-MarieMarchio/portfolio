import { ClockService } from './clock.service';
import { injectOn } from '@testing/fixtures/testbed.fixture';

describe('ClockService', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('is inert on the server: no time, no frame, no delay', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const now = vi.spyOn(performance, 'now');
    const frame = vi.spyOn(window, 'requestAnimationFrame');
    const clock = injectOn(ClockService, 'server');
    const called = vi.fn();

    expect(clock.now()).toBe(0);
    clock.nextFrame(called)();
    clock.after(10, called);
    vi.advanceTimersByTime(100);

    expect(now).not.toHaveBeenCalled();
    expect(frame).not.toHaveBeenCalled();
    expect(called).not.toHaveBeenCalled();
  });

  it('reads a monotonic time in the browser', () => {
    const clock = injectOn(ClockService, 'browser');
    const first = clock.now();

    expect(first).toBeGreaterThan(0);
    expect(clock.now()).toBeGreaterThanOrEqual(first);
  });

  it('asks for the next frame and cancels it, in the browser', () => {
    const frame = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(7);
    const cancel = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation(() => {});
    const called = vi.fn();

    injectOn(ClockService, 'browser').nextFrame(called)();

    expect(frame).toHaveBeenCalledWith(called);
    expect(cancel).toHaveBeenCalledWith(7);
  });

  it('calls back after the delay, unless cancelled, in the browser', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const clock = injectOn(ClockService, 'browser');
    const kept = vi.fn();
    const cancelled = vi.fn();

    clock.after(1000, kept);
    clock.after(1000, cancelled)();
    vi.advanceTimersByTime(999);
    expect(kept).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    expect(kept).toHaveBeenCalledTimes(1);
    expect(cancelled).not.toHaveBeenCalled();
  });

  it('calls back once the browser is idle, within 2 s, unless cancelled', () => {
    const idle = vi.fn(() => 3);
    const cancel = vi.fn();
    vi.stubGlobal('requestIdleCallback', idle);
    vi.stubGlobal('cancelIdleCallback', cancel);
    const clock = injectOn(ClockService, 'browser');
    const called = vi.fn();

    clock.whenIdle(called)();

    expect(idle).toHaveBeenCalledWith(called, { timeout: 2000 });
    expect(cancel).toHaveBeenCalledWith(3);
    vi.unstubAllGlobals();
  });

  it('falls back to a short delay where the browser has no idle callback', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    vi.stubGlobal('requestIdleCallback', undefined);
    const clock = injectOn(ClockService, 'browser');
    const called = vi.fn();

    clock.whenIdle(called);
    vi.advanceTimersByTime(199);
    expect(called).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    expect(called).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('never calls back on the server when idle', () => {
    const clock = injectOn(ClockService, 'server');
    const called = vi.fn();

    clock.whenIdle(called)();

    expect(called).not.toHaveBeenCalled();
  });
});
