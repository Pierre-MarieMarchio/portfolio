import { TestBed } from '@angular/core/testing';
import { MOBILE_NAV_PLATFORM } from '@shared/mobile-nav/ports';
import { provideMobileNav } from './mobile-nav.provider';
import { stubObservers } from '@testing/doubles/browser.double';
import { onPlatform, Platform } from '@testing/fixtures/testbed.fixture';

const platformOn = (platform: Platform) => {
  onPlatform(platform);
  TestBed.configureTestingModule({ providers: [provideMobileNav()] });
  return TestBed.inject(MOBILE_NAV_PLATFORM);
};

describe('provideMobileNav', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('is inert on the server: no frame, no delay, no observer, no scrollend', () => {
    vi.useFakeTimers();
    const observers = stubObservers();
    const platform = platformOn('server');
    const called = vi.fn();

    platform.nextFrame(called);
    platform.after(10, called);
    platform.onResize(document.createElement('div'), called);
    vi.advanceTimersByTime(100);

    expect(called).not.toHaveBeenCalled();
    expect(observers).toEqual([]);
    expect(platform.hasScrollEnd()).toBe(false);
  });

  it('waits and observes in the browser', () => {
    vi.useFakeTimers();
    const observers = stubObservers();
    const platform = platformOn('browser');
    const called = vi.fn();

    platform.after(10, called);
    platform.onResize(document.createElement('div'), called);
    vi.advanceTimersByTime(10);

    expect(called).toHaveBeenCalledOnce();
    expect(observers.map((observer) => observer.kind)).toEqual(['resize']);
  });
});
