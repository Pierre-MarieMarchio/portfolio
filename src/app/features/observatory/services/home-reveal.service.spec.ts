import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HomeRevealService } from './home-reveal.service';

const setUp = (
  options: { reducedMotion?: boolean; crossing?: string } = {},
) => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches:
      query === '(prefers-reduced-motion: reduce)' && !!options.reducedMotion,
  }));
  if (options.crossing !== undefined) {
    document.documentElement.style.setProperty(
      '--arrival-at',
      options.crossing,
    );
  }
  TestBed.configureTestingModule({
    providers: [
      { provide: PLATFORM_ID, useValue: 'browser' },
      HomeRevealService,
    ],
  });
  return TestBed.inject(HomeRevealService);
};

describe('HomeRevealService', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--arrival-at');
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('holds the rest on the home page until the first gesture, then lets it in', () => {
    const reveal = setUp({ crossing: '8700ms' });
    const onArrived = vi.fn();

    reveal.start(true, onArrived);
    expect(reveal.arrival()).toBe('held');
    window.dispatchEvent(new Event('keydown'));

    expect(reveal.arrival()).toBe('shown');
    expect(onArrived).toHaveBeenCalledTimes(1);
  });

  it('lets the rest in at the end of the crossing at the latest', () => {
    const reveal = setUp({ crossing: '8700ms' });
    const onArrived = vi.fn();

    reveal.start(true, onArrived);
    vi.advanceTimersByTime(8699);
    expect(reveal.arrival()).toBe('held');
    vi.advanceTimersByTime(1);

    expect(reveal.arrival()).toBe('shown');
    expect(onArrived).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['off the home page', false, { crossing: '8700ms' }],
    ['with less motion', true, { crossing: '8700ms', reducedMotion: true }],
    ['without a crossing token', true, {}],
  ])(
    'shows all at once %s, and never runs the arrival',
    (_case, isOnHome, options) => {
      const reveal = setUp(options);
      const onArrived = vi.fn();

      reveal.start(isOnHome, onArrived);
      reveal.arrive();
      window.dispatchEvent(new Event('keydown'));
      vi.advanceTimersByTime(10_000);

      expect(reveal.arrival()).toBe('shown');
      expect(onArrived).not.toHaveBeenCalled();
    },
  );
});
