import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { ObservatoryView } from '@app/features/observatory/models';
import { ObservatoryManager } from '@app/features/observatory/states';
import { HomeRevealService } from './home-reveal.service';
import { stubMedia } from '@testing/doubles/browser.double';
import { ARRIVAL_AT } from '@testing/fixtures/observatory.fixture';

const setUp = (
  options: {
    reducedMotion?: boolean;
    crossing?: string;
    view?: ObservatoryView;
  } = {},
) => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  stubMedia(
    (query) =>
      query === '(prefers-reduced-motion: reduce)' && !!options.reducedMotion,
  );
  if (options.crossing !== undefined) {
    document.documentElement.style.setProperty(
      '--arrival-at',
      options.crossing,
    );
  }
  TestBed.configureTestingModule({
    providers: [
      { provide: PLATFORM_ID, useValue: 'browser' },
      provideStatewise(),
      HomeRevealService,
    ],
  });
  const station = TestBed.inject(ObservatoryManager);
  station.syncRoute(options.view ?? 'home');
  return { reveal: TestBed.inject(HomeRevealService), station };
};

describe('HomeRevealService', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--arrival-at');
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('holds the rest on the home page until the first gesture, then lets it in', () => {
    const { reveal } = setUp({ crossing: ARRIVAL_AT.css });
    const onArrived = vi.fn();

    reveal.start(onArrived);
    expect(reveal.arrival()).toBe('withheld');
    window.dispatchEvent(new Event('keydown'));

    expect(reveal.arrival()).toBe('shown');
    expect(onArrived).toHaveBeenCalledTimes(1);
  });

  it('lets the rest in at the end of the crossing at the latest', () => {
    const { reveal } = setUp({ crossing: ARRIVAL_AT.css });
    const onArrived = vi.fn();

    reveal.start(onArrived);
    vi.advanceTimersByTime(ARRIVAL_AT.ms - 1);
    expect(reveal.arrival()).toBe('withheld');
    vi.advanceTimersByTime(1);

    expect(reveal.arrival()).toBe('shown');
    expect(onArrived).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['off the home page', { crossing: ARRIVAL_AT.css, view: 'index' as const }],
    ['with less motion', { crossing: ARRIVAL_AT.css, reducedMotion: true }],
    ['without a crossing token', {}],
  ])('shows all at once %s, and never runs the arrival', (_case, options) => {
    const { reveal } = setUp(options);
    const onArrived = vi.fn();

    reveal.start(onArrived);
    reveal.arrive();
    window.dispatchEvent(new Event('keydown'));
    vi.advanceTimersByTime(10_000);

    expect(reveal.arrival()).toBe('shown');
    expect(onArrived).not.toHaveBeenCalled();
  });

  it.each<ObservatoryView>(['index', 'sheet', 'about', 'not-found'])(
    'shows the rest on "%s" before anything starts, and opens nothing there',
    (view) => {
      const { reveal } = setUp({ crossing: ARRIVAL_AT.css, view });

      expect(reveal.arrival()).toBe('shown');
      expect(reveal.isOpening()).toBe(false);
    },
  );

  it('opens on the home page until the rest arrives, the time before it starts included', () => {
    const { reveal } = setUp({ crossing: ARRIVAL_AT.css });

    expect(reveal.arrival()).toBe('timed');
    expect(reveal.isOpening()).toBe(true);
    reveal.start(() => {});
    expect(reveal.isOpening()).toBe(true);

    window.dispatchEvent(new Event('pointerdown'));
    expect(reveal.isOpening()).toBe(false);
  });

  it('never opens the home page reached from another view', () => {
    const { reveal, station } = setUp({
      crossing: ARRIVAL_AT.css,
      view: 'about',
    });
    reveal.start(() => {});

    station.syncRoute('home');

    expect(reveal.arrival()).toBe('shown');
    expect(reveal.isOpening()).toBe(false);
  });

  it('lets the rest in as soon as the reader leaves the home page, and plays what waited for it', () => {
    const { reveal, station } = setUp({ crossing: ARRIVAL_AT.css });
    const arrived = vi.fn();
    reveal.start(arrived);

    station.syncRoute('index');
    TestBed.tick();

    expect(arrived).toHaveBeenCalledTimes(1);
    station.syncRoute('home');
    TestBed.tick();
    expect(reveal.arrival()).toBe('shown');
  });
});
