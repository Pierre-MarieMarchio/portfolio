import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PagerComponent } from './pager.component';
import { PagerPageComponent } from '../pager-page/pager-page.component';
import {
  BrowserWindowService,
  ClockService,
  ElementObserverService,
  MediaPreferencesService,
} from '@app/core/services';
import {
  BrowserWindowDouble,
  ClockDouble,
  ElementObserverDouble,
  MediaPreferencesDouble,
} from '@testing/doubles/browser-services.double';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { fireTouch, swipe } from '@testing/fixtures/pointer.fixture';

const WIDTH = 300;

@Component({
  imports: [PagerComponent, PagerPageComponent],
  template: `
    <app-pager
      [index]="index()"
      (indexChange)="choose($event)"
      (shownChange)="shown.push($event)"
    >
      @for (name of names; track name) {
        <app-pager-page>
          <a href="#{{ name }}">{{ name }}</a>
        </app-pager-page>
      }
    </app-pager>
  `,
})
class PagerHost {
  public readonly names = ['one', 'two', 'three', 'four'];
  public readonly index = signal(0);
  public readonly changes: number[] = [];
  public readonly shown: number[] = [];

  public choose(index: number): void {
    this.changes.push(index);
    this.index.set(index);
  }
}

const layOut = (pager: HTMLElement, width: number): void => {
  Object.defineProperty(pager, 'clientWidth', {
    value: width,
    configurable: true,
  });
  Object.defineProperty(pager, 'scrollWidth', {
    value: 4 * width,
    configurable: true,
  });
};

const setup = async ({ index = 0 } = {}) => {
  const clock = new ClockDouble();
  const observer = new ElementObserverDouble();
  const media = new MediaPreferencesDouble();
  const browserWindow = new BrowserWindowDouble();
  TestBed.configureTestingModule({
    imports: [PagerHost],
    providers: [
      provideTexts(),
      { provide: ClockService, useValue: clock },
      { provide: ElementObserverService, useValue: observer },
      { provide: MediaPreferencesService, useValue: media },
      { provide: BrowserWindowService, useValue: browserWindow },
    ],
  });
  const fixture = TestBed.createComponent(PagerHost);
  fixture.componentInstance.index.set(index);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  const pager = host.querySelector('app-pager') as HTMLElement;
  let scrollLeft = 0;
  Object.defineProperty(pager, 'scrollLeft', {
    get: () => scrollLeft,
    set: (left: number) => {
      scrollLeft = left;
    },
    configurable: true,
  });
  const scrollTo = vi.fn();
  Object.defineProperty(pager, 'scrollTo', {
    value: scrollTo,
    configurable: true,
  });
  layOut(pager, WIDTH);
  const pages = [...host.querySelectorAll<HTMLElement>('app-pager-page')];
  return {
    fixture,
    clock,
    observer,
    media,
    browserWindow,
    pager,
    scrollTo,
    changes: fixture.componentInstance.changes,
    shown: fixture.componentInstance.shown,
    current: () => pages.findIndex((page) => !page.hasAttribute('inert')),
    reachable: () => pages.filter((page) => !page.hasAttribute('inert')),
    rest: async (left: number, events = ['scroll', 'scrollend']) => {
      scrollLeft = left;
      for (const type of events) {
        pager.dispatchEvent(new Event(type));
      }
      await fixture.whenStable();
    },
    pointTo: async (target: number) => {
      fixture.componentInstance.index.set(target);
      await fixture.whenStable();
    },
  };
};

const swipeFrom = async (
  page: number,
  gesture: { dx?: number; dy?: number; ms?: number },
) => {
  const harness = await setup({ index: page });
  harness.clock.frame();
  await harness.rest(page * WIDTH);
  harness.scrollTo.mockClear();
  swipe(harness.pager, gesture);
  return harness;
};

describe('PagerComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rests on its first page from birth without reading its layout', async () => {
    const reads = vi.spyOn(Element.prototype, 'scrollLeft', 'get');

    await setup();

    expect(reads).not.toHaveBeenCalled();
  });

  it('renders every page, and lets only the current one be reached', async () => {
    const { fixture, reachable } = await setup({ index: 1 });
    const pages = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll(
        'app-pager-page',
      ),
    ];

    expect(pages).toHaveLength(4);
    expect(reachable().map((page) => page.textContent?.trim())).toEqual([
      'two',
    ]);
    expect(pages.map((page) => page.getAttribute('aria-label'))).toEqual([
      'Page 1 sur 4',
      'Page 2 sur 4',
      'Page 3 sur 4',
      'Page 4 sur 4',
    ]);
  });

  it('shows the nearest page as soon as the scroll approaches it, but says so only once it has ended', async () => {
    const { changes, current, rest } = await setup();

    await rest(WIDTH, ['scroll']);

    expect(changes).toEqual([]);
    expect(current()).toBe(1);

    await rest(WIDTH, ['scrollend']);

    expect(changes).toEqual([1]);
    expect(current()).toBe(1);
  });

  it('reports the visible page every time it changes, well before the scroll ends', async () => {
    const { shown, rest } = await setup();

    expect(shown).toEqual([0]);

    await rest(WIDTH, ['scroll']);

    expect(shown).toEqual([0, 1]);

    await rest(0, ['scroll']);

    expect(shown).toEqual([0, 1, 0]);

    await rest(0, ['scrollend']);

    expect(shown).toEqual([0, 1, 0]);
  });

  it('never reports the same visible page twice in a row', async () => {
    const { shown, rest } = await setup();

    await rest(WIDTH - 2, ['scroll']);
    await rest(WIDTH, ['scroll']);
    await rest(WIDTH, ['scrollend']);

    expect(shown).toEqual([0, 1]);
  });

  it('listens to touch passively, so it never blocks the browser from scrolling', async () => {
    const addEventListener = vi.spyOn(Element.prototype, 'addEventListener');

    await setup();

    const touchCalls = addEventListener.mock.calls.filter(([type]) =>
      ['touchstart', 'touchend', 'touchcancel'].includes(type),
    );
    expect(touchCalls).toHaveLength(3);
    expect(
      touchCalls.every(
        ([, , options]) =>
          (options as AddEventListenerOptions | undefined)?.passive === true,
      ),
    ).toBe(true);
  });

  it('shows the page the browser announces as its next snap target, before the scroll ends', async () => {
    const { observer, pager, fixture, current } = await setup();
    const pages = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll(
        'app-pager-page',
      ),
    ];

    observer.snapTo(pager, pages[2] ?? null);
    await fixture.whenStable();

    expect(current()).toBe(2);
  });

  it('follows only the snap announcements once the browser makes them, ignoring the nearest guess from scroll', async () => {
    const { observer, pager, fixture, current, rest } = await setup();
    observer.knowsSnapChanging = true;
    const pages = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll(
        'app-pager-page',
      ),
    ];

    observer.snapTo(pager, pages[2] ?? null);
    await rest(WIDTH, ['scroll']);

    expect(current()).toBe(2);
  });

  it('commits the nearest page even a couple of pixels off the exact offset', async () => {
    const { changes, current, rest } = await setup();

    await rest(WIDTH - 2, ['scroll', 'scrollend']);

    expect(current()).toBe(1);
    expect(changes).toEqual([1]);
  });

  it('commits the nearest page even a fraction of a pixel off the exact offset', async () => {
    const { changes, current, rest } = await setup();

    await rest(WIDTH - 0.6, ['scroll', 'scrollend']);

    expect(current()).toBe(1);
    expect(changes).toEqual([1]);
  });

  it('never scrolls to a page set from outside while a finger is on the pager, but catches up once it lifts', async () => {
    const { clock, pager, scrollTo, pointTo } = await setup();

    pager.dispatchEvent(new Event('touchstart'));
    await pointTo(2);

    expect(scrollTo).not.toHaveBeenCalled();

    pager.dispatchEvent(new Event('touchend'));
    clock.frame();

    expect(scrollTo).toHaveBeenCalledWith({
      left: 2 * WIDTH,
      behavior: 'smooth',
    });
  });

  it('keeps a realignment off while the scroll has not ended, and catches up once it does', async () => {
    const { observer, pager, scrollTo, rest } = await setup();
    await rest(2 * WIDTH);
    scrollTo.mockClear();

    pager.dispatchEvent(new Event('scroll'));
    layOut(pager, 400);
    observer.resize();

    expect(scrollTo).not.toHaveBeenCalled();

    await rest(2 * WIDTH, ['scrollend']);

    expect(scrollTo).toHaveBeenCalledWith({ left: 800, behavior: 'instant' });
  });

  it('says nothing when the scroll ends back on the current page, or between two', async () => {
    const { changes, current, rest } = await setup({ index: 1 });

    await rest(WIDTH);
    await rest(1.5 * WIDTH);

    expect(changes).toEqual([]);
    expect(current()).toBe(1);
  });

  it('scrolls smoothly, after the next frame, to a page set from outside, and does not echo it', async () => {
    const { clock, scrollTo, changes, shown, current, rest, pointTo } =
      await setup();

    await pointTo(2);

    expect(scrollTo).not.toHaveBeenCalled();
    expect(current()).toBe(2);

    clock.frame();

    expect(scrollTo).toHaveBeenCalledWith({
      left: 2 * WIDTH,
      behavior: 'smooth',
    });
    expect(current()).toBe(2);

    await rest(2 * WIDTH);

    expect(current()).toBe(2);
    expect(changes).toEqual([]);
    expect(shown).toEqual([0, 2]);
  });

  it('reaches the page it was heading to without ever showing the pages a programmed scroll crosses', async () => {
    const { clock, changes, shown, current, rest, pointTo } = await setup();

    await pointTo(3);
    clock.frame();

    expect(current()).toBe(3);

    await rest(WIDTH, ['scroll']);
    await rest(2 * WIDTH, ['scroll']);
    await rest(3 * WIDTH, ['scroll', 'scrollend']);

    expect(current()).toBe(3);
    expect(changes).toEqual([]);
    expect(shown).toEqual([0, 3]);
  });

  it('lets a finger take over from a programmed scroll, resuming ordinary tracking', async () => {
    const { clock, pager, changes, current, rest, pointTo } = await setup();

    await pointTo(3);
    clock.frame();
    pager.dispatchEvent(new Event('touchstart'));

    await rest(WIDTH, ['scroll']);

    expect(current()).toBe(1);

    await rest(WIDTH, ['scrollend']);

    expect(current()).toBe(1);
    expect(changes).toEqual([1]);
  });

  it('ignores a scroll that ends before its own scroll to a page set from outside starts', async () => {
    const { changes, rest, pointTo } = await setup({ index: 1 });

    await pointTo(3);
    await rest(WIDTH, ['scrollend']);

    expect(changes).toEqual([]);
  });

  it('jumps to the page without animation under reduced motion', async () => {
    const { clock, media, scrollTo, current, pointTo, fixture } = await setup();
    media.isReduced = true;

    await pointTo(3);
    clock.frame();
    await fixture.whenStable();

    expect(scrollTo).toHaveBeenCalledWith({
      left: 3 * WIDTH,
      behavior: 'instant',
    });
    expect(current()).toBe(3);
  });

  it('settles 120 ms after the last scroll where the browser has no scrollend', async () => {
    const { browserWindow, clock, fixture, changes, rest } = await setup();
    browserWindow.knowsScrollEnd = false;

    await rest(WIDTH, ['scroll']);
    await rest(2 * WIDTH, ['scroll']);
    clock.elapse(119);

    expect(changes).toEqual([]);

    clock.elapse(120);
    await fixture.whenStable();

    expect(changes).toEqual([2]);
  });

  it('stays on its page when its width changes', async () => {
    const { observer, pager, scrollTo, rest } = await setup();
    await rest(2 * WIDTH);
    observer.resize();
    scrollTo.mockClear();

    layOut(pager, 400);
    observer.resize();

    expect(scrollTo).toHaveBeenCalledWith({ left: 800, behavior: 'instant' });
  });

  it('keeps its page when it is shown again after a width of 0', async () => {
    const { observer, pager, scrollTo, changes, rest } = await setup();
    await rest(2 * WIDTH);
    observer.resize();
    scrollTo.mockClear();

    layOut(pager, 0);
    observer.resize();
    await rest(0);
    expect(scrollTo).not.toHaveBeenCalled();

    layOut(pager, WIDTH);
    observer.resize();

    expect(scrollTo).toHaveBeenCalledWith({
      left: 2 * WIDTH,
      behavior: 'instant',
    });
    expect(changes).toEqual([2]);
  });

  describe('following a short swipe', () => {
    it('advances one page on a clear leftward swipe', async () => {
      const { scrollTo } = await swipeFrom(1, { dx: -60 });

      expect(scrollTo).toHaveBeenCalledExactlyOnceWith({
        left: 2 * WIDTH,
        behavior: 'smooth',
      });
    });

    it('goes back one page on a clear rightward swipe', async () => {
      const { scrollTo } = await swipeFrom(2, { dx: 60 });

      expect(scrollTo).toHaveBeenCalledExactlyOnceWith({
        left: WIDTH,
        behavior: 'smooth',
      });
    });

    it('stays on the page when the swipe is too short', async () => {
      const { scrollTo } = await swipeFrom(1, { dx: -10 });

      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('stays on the page when the swipe is too slow', async () => {
      const { scrollTo } = await swipeFrom(1, { dx: -30, ms: 1000 });

      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('stays on the page when the swipe is more vertical than horizontal', async () => {
      const { scrollTo } = await swipeFrom(1, { dx: -40, dy: 80 });

      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('ignores a gesture that starts with two fingers', async () => {
      const { pager, scrollTo } = await swipeFrom(1, {});

      fireTouch(pager, 'touchstart', {
        fingers: [{ x: 200 }, { x: 250 }],
        at: 0,
      });
      fireTouch(pager, 'touchend', { fingers: [{ x: 100 }], at: 100 });

      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('ignores a gesture that ends with two fingers', async () => {
      const { pager, scrollTo } = await swipeFrom(1, {});

      fireTouch(pager, 'touchstart', { fingers: [{ x: 200 }], at: 0 });
      fireTouch(pager, 'touchend', {
        fingers: [{ x: 100 }, { x: 120 }],
        at: 100,
      });

      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('ignores a gesture that is cancelled', async () => {
      const { pager, scrollTo } = await swipeFrom(1, {});

      fireTouch(pager, 'touchstart', { fingers: [{ x: 200 }], at: 0 });
      fireTouch(pager, 'touchcancel', { fingers: [{ x: 100 }], at: 100 });

      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('jumps without animation under reduced motion', async () => {
      const harness = await setup({ index: 1 });
      harness.clock.frame();
      await harness.rest(WIDTH);
      harness.media.isReduced = true;
      harness.scrollTo.mockClear();

      swipe(harness.pager, { dx: -60 });

      expect(harness.scrollTo).toHaveBeenCalledExactlyOnceWith({
        left: 2 * WIDTH,
        behavior: 'instant',
      });
    });

    it('does not scroll when the pager already shows the target page', async () => {
      const { pager, scrollTo } = await swipeFrom(1, {});

      fireTouch(pager, 'touchstart', { fingers: [{ x: 200 }], at: 0 });
      Object.defineProperty(pager, 'scrollLeft', {
        value: 2 * WIDTH,
        configurable: true,
      });
      fireTouch(pager, 'touchend', { fingers: [{ x: 140 }], at: 100 });

      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('does not start a swipe while the pager has no width', async () => {
      const { pager, scrollTo } = await swipeFrom(1, {});
      layOut(pager, 0);

      swipe(pager, { dx: -60 });

      expect(scrollTo).not.toHaveBeenCalled();
    });
  });
});
