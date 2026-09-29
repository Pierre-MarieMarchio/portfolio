import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MOBILE_NAV_PLATFORM } from '@shared/mobile-nav/ports';
import { MobileNavPlatformService } from './mobile-nav-platform.service';
import { stubObservers } from '@testing/doubles/browser.double';
import { onPlatform, Platform } from '@testing/fixtures/testbed.fixture';

const platformOn = (platform: Platform) => {
  onPlatform(platform);
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      { provide: MOBILE_NAV_PLATFORM, useClass: MobileNavPlatformService },
    ],
  });
  return TestBed.inject(MOBILE_NAV_PLATFORM);
};

describe('MobileNavPlatformService', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('is inert on the server: not compact, no frame, no delay, no observer, no scrollend, no history', async () => {
    vi.useFakeTimers();
    const observers = stubObservers();
    const pushState = vi.spyOn(history, 'pushState');
    const platform = platformOn('server');
    const called = vi.fn();

    platform.nextFrame(called);
    platform.after(10, called);
    platform.onResize(document.createElement('div'), called);
    platform.pushHistory({ layer: 1 });
    platform.onHistoryPop(called);
    window.dispatchEvent(new PopStateEvent('popstate'));
    vi.advanceTimersByTime(100);

    expect(called).not.toHaveBeenCalled();
    expect(observers).toEqual([]);
    expect(pushState).not.toHaveBeenCalled();
    expect(platform.isCompact()).toBe(false);
    expect(platform.hasScrollEnd()).toBe(false);
    expect(platform.closesOnBack()).toBe(false);
    expect(platform.historyState()).toBeNull();
    await expect(
      platform.whenStill(document.createElement('div')),
    ).resolves.toBeUndefined();
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

  it('reports no snap change where the browser does not announce one', () => {
    const platform = platformOn('browser');
    const called = vi.fn();

    const stop = platform.onSnapChanging(document.createElement('div'), called);
    stop();

    expect(called).not.toHaveBeenCalled();
  });

  it('says whether the browser announces snap targets', () => {
    const platform = platformOn('browser');

    expect(platform.hasSnapChanging()).toBe(false);
  });

  it('says when the router starts to leave the view, until stopped', async () => {
    const platform = platformOn('browser');
    const left = vi.fn();
    const stop = platform.onLeave(left);

    await TestBed.inject(Router).navigateByUrl('/projets');
    stop();
    await TestBed.inject(Router).navigateByUrl('/a-propos');

    expect(left).toHaveBeenCalledOnce();
  });
});
