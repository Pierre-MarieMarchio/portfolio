import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UserPresenceService } from './user-presence.service';

const inject = (
  platform: 'browser' | 'server',
  options: { reducedMotion?: boolean } = {},
) => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches:
      query === '(prefers-reduced-motion: reduce)' && !!options.reducedMotion,
  }));
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: platform }],
  });
  return TestBed.inject(UserPresenceService);
};

describe('UserPresenceService', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('is inert on the server: no one is there, whatever the delay', () => {
    const presence = inject('server', { reducedMotion: true });
    const called = vi.fn();

    presence.whenPresent(10, called);
    presence.whenPresent(null, called);
    vi.advanceTimersByTime(100);
    window.dispatchEvent(new Event('keydown'));

    expect(called).not.toHaveBeenCalled();
  });

  it.each(['pointerdown', 'keydown', 'wheel', 'touchstart'])(
    'calls back once, at a first %s',
    (type) => {
      const called = vi.fn();

      inject('browser').whenPresent(1000, called);
      window.dispatchEvent(new Event(type));
      window.dispatchEvent(new Event('keydown'));
      vi.advanceTimersByTime(1000);

      expect(called).toHaveBeenCalledTimes(1);
    },
  );

  it('calls back once, after the delay at the latest', () => {
    const called = vi.fn();

    inject('browser').whenPresent(1000, called);
    vi.advanceTimersByTime(999);
    expect(called).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    window.dispatchEvent(new Event('pointerdown'));

    expect(called).toHaveBeenCalledTimes(1);
  });

  it('calls back at once when the reader asked for less motion', () => {
    const called = vi.fn();

    inject('browser', { reducedMotion: true }).whenPresent(1000, called);

    expect(called).toHaveBeenCalledTimes(1);
  });

  it('calls back at once when there is no delay to wait', () => {
    const called = vi.fn();

    inject('browser').whenPresent(null, called);

    expect(called).toHaveBeenCalledTimes(1);
  });

  it('never calls back once cancelled', () => {
    const called = vi.fn();

    inject('browser').whenPresent(1000, called)();
    vi.advanceTimersByTime(1000);
    window.dispatchEvent(new Event('touchstart'));

    expect(called).not.toHaveBeenCalled();
  });
});
