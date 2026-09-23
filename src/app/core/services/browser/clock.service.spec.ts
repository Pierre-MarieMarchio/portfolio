import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ClockService } from './clock.service';

const inject = (platform: 'browser' | 'server') => {
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: platform }],
  });
  return TestBed.inject(ClockService);
};

describe('ClockService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('is inert on the server: no time, no frame, no delay', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const now = vi.spyOn(performance, 'now');
    const frame = vi.spyOn(window, 'requestAnimationFrame');
    const clock = inject('server');
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
    const clock = inject('browser');
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

    inject('browser').nextFrame(called)();

    expect(frame).toHaveBeenCalledWith(called);
    expect(cancel).toHaveBeenCalledWith(7);
  });

  it('calls back after the delay, unless cancelled, in the browser', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const clock = inject('browser');
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
});
