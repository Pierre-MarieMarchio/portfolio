import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CardCarouselComponent } from './card-carousel.component';
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

const STEP = 236;

@Component({
  imports: [CardCarouselComponent],
  template: `
    <app-card-carousel
      label="Vedettes"
      controls="panel"
      [items]="names"
      [active]="active()"
      (activeChange)="show($event)"
      (chosen)="chosen.push($event)"
    >
      <ng-template let-name let-index="index">
        <span class="name">{{ name }}</span>
        <span class="rank">{{ index }}</span>
      </ng-template>
    </app-card-carousel>
  `,
})
class CarouselHost {
  public readonly names = ['one', 'two', 'three', 'four'];
  public readonly active = signal(0);
  public readonly changes: number[] = [];
  public readonly chosen: number[] = [];

  public show(index: number): void {
    this.changes.push(index);
    this.active.set(index);
  }
}

const define = (element: HTMLElement, key: string, value: unknown): void => {
  Object.defineProperty(element, key, { value, configurable: true });
};

const layOut = (track: HTMLElement, places: HTMLElement[], width: number) => {
  const peek = width * 0.12;
  const card = width - 2 * peek;
  define(track, 'clientWidth', width);
  define(track, 'scrollWidth', 2 * peek + 4 * card + 3 * 8);
  for (const [index, place] of places.entries()) {
    define(place, 'offsetLeft', peek + index * (card + 8));
    define(place, 'offsetWidth', card);
  }
};

const setup = async ({ active = 0 } = {}) => {
  const clock = new ClockDouble();
  const observer = new ElementObserverDouble();
  const media = new MediaPreferencesDouble();
  const browserWindow = new BrowserWindowDouble();
  TestBed.configureTestingModule({
    imports: [CarouselHost],
    providers: [
      provideTexts(),
      { provide: ClockService, useValue: clock },
      { provide: ElementObserverService, useValue: observer },
      { provide: MediaPreferencesService, useValue: media },
      { provide: BrowserWindowService, useValue: browserWindow },
    ],
  });
  const fixture = TestBed.createComponent(CarouselHost);
  fixture.componentInstance.active.set(active);
  const host = fixture.nativeElement as HTMLElement;
  await fixture.whenStable();
  const track = host.querySelector('.scroller') as HTMLElement;
  const places = [...host.querySelectorAll<HTMLElement>('.scroller li')];
  let scrollLeft = active * STEP;
  Object.defineProperty(track, 'scrollLeft', {
    get: () => scrollLeft,
    set: (left: number) => {
      scrollLeft = left;
    },
    configurable: true,
  });
  const scrollTo = vi.fn();
  define(track, 'scrollTo', scrollTo);
  layOut(track, places, 300);
  const cards = [...host.querySelectorAll<HTMLButtonElement>('.card')];
  const dots = [...host.querySelectorAll<HTMLButtonElement>('.dot')];
  return {
    fixture,
    host,
    clock,
    observer,
    media,
    browserWindow,
    track,
    places,
    cards,
    dots,
    scrollTo,
    changes: fixture.componentInstance.changes,
    chosen: fixture.componentInstance.chosen,
    current: () => cards.findIndex((card) => card.hasAttribute('aria-current')),
    currentDot: () =>
      dots.findIndex((dot) => dot.getAttribute('aria-current') === 'true'),
    rest: async (left: number, events = ['scroll', 'scrollend']) => {
      scrollLeft = left;
      for (const type of events) {
        track.dispatchEvent(new Event(type));
      }
      await fixture.whenStable();
    },
    pointTo: async (target: number) => {
      fixture.componentInstance.active.set(target);
      await fixture.whenStable();
    },
  };
};

describe('CardCarouselComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rests on its first card from birth without reading its layout', async () => {
    const reads = vi.spyOn(Element.prototype, 'scrollLeft', 'get');

    await setup();

    expect(reads).not.toHaveBeenCalled();
  });

  it('renders a labelled region with one card button per item, drawn by the template', async () => {
    const { host, cards } = await setup();
    const region = host.querySelector('app-card-carousel');

    expect(region?.getAttribute('role')).toBe('region');
    expect(region?.getAttribute('aria-label')).toBe('Vedettes');
    expect(cards.map((card) => card.tagName)).toEqual([
      'BUTTON',
      'BUTTON',
      'BUTTON',
      'BUTTON',
    ]);
    expect(
      cards.map((card) => card.textContent?.replaceAll(/\s+/g, '')),
    ).toEqual(['one0', 'two1', 'three2', 'four3']);
    expect(cards.every((card) => card.getAttribute('aria-controls'))).toBe(
      true,
    );
  });

  it('marks the current card and its dot, and keeps the dots out of the tab order', async () => {
    const { dots, current, currentDot } = await setup({ active: 2 });

    expect(current()).toBe(2);
    expect(currentDot()).toBe(2);
    expect(dots.map((dot) => dot.getAttribute('aria-label'))).toEqual([
      'Page 1 sur 4',
      'Page 2 sur 4',
      'Page 3 sur 4',
      'Page 4 sur 4',
    ]);
    expect(dots.every((dot) => dot.tabIndex === -1)).toBe(true);
  });

  it('shows the nearest card as soon as the scroll approaches it, but says so only once it has ended', async () => {
    const { changes, current, rest } = await setup();

    await rest(STEP, ['scroll']);

    expect(changes).toEqual([]);
    expect(current()).toBe(1);

    await rest(STEP, ['scrollend']);

    expect(changes).toEqual([1]);
    expect(current()).toBe(1);
  });

  it('shows the card the browser announces as its next snap target, before the scroll ends', async () => {
    const { observer, track, places, current, fixture } = await setup();

    observer.snapTo(track, places[2] ?? null);
    await fixture.whenStable();

    expect(current()).toBe(2);
  });

  it('follows only the snap announcements once the browser makes them, ignoring the nearest guess from scroll', async () => {
    const { observer, track, places, current, rest } = await setup();
    observer.knowsSnapChanging = true;

    observer.snapTo(track, places[2] ?? null);
    await rest(STEP, ['scroll']);

    expect(current()).toBe(2);
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

  it('commits the nearest card even a couple of pixels off the exact offset', async () => {
    const { changes, current, rest } = await setup();

    await rest(STEP - 2, ['scroll', 'scrollend']);

    expect(current()).toBe(1);
    expect(changes).toEqual([1]);
  });

  it('commits the nearest card even a fraction of a pixel off the exact offset', async () => {
    const { changes, current, rest } = await setup();

    await rest(STEP - 0.6, ['scroll', 'scrollend']);

    expect(current()).toBe(1);
    expect(changes).toEqual([1]);
  });

  it('never scrolls to a card set from outside while a finger is on the track, but catches up once it lifts', async () => {
    const { clock, track, scrollTo, pointTo } = await setup();

    track.dispatchEvent(new Event('touchstart'));
    await pointTo(2);

    expect(scrollTo).not.toHaveBeenCalled();

    track.dispatchEvent(new Event('touchend'));
    clock.frame();

    expect(scrollTo).toHaveBeenCalledWith({
      left: 2 * STEP,
      behavior: 'smooth',
    });
  });

  it('keeps a realignment off while the scroll has not ended, and catches up once it does', async () => {
    const { observer, track, places, scrollTo, rest } = await setup();
    await rest(2 * STEP);
    scrollTo.mockClear();

    track.dispatchEvent(new Event('scroll'));
    layOut(track, places, 400);
    observer.resize();

    expect(scrollTo).not.toHaveBeenCalled();

    await rest(2 * STEP, ['scrollend']);

    expect(scrollTo).toHaveBeenCalledWith({
      left: 2 * (400 - 2 * 48 + 8),
      behavior: 'instant',
    });
  });

  it('says nothing when the scroll ends back on the current card, or between two', async () => {
    const { changes, current, rest } = await setup({ active: 1 });

    await rest(STEP);
    await rest(1.5 * STEP);

    expect(changes).toEqual([]);
    expect(current()).toBe(1);
  });

  it('scrolls smoothly, after the next frame, to a card set from outside, and does not echo it', async () => {
    const { clock, scrollTo, changes, current, rest, pointTo } = await setup();

    await pointTo(2);

    expect(scrollTo).not.toHaveBeenCalled();
    expect(current()).toBe(2);

    clock.frame();

    expect(scrollTo).toHaveBeenCalledWith({
      left: 2 * STEP,
      behavior: 'smooth',
    });
    expect(current()).toBe(2);

    await rest(2 * STEP);

    expect(current()).toBe(2);
    expect(changes).toEqual([]);
  });

  it('reaches the card it was heading to without ever showing the cards a programmed scroll crosses', async () => {
    const { clock, changes, current, rest, pointTo } = await setup();

    await pointTo(3);
    clock.frame();

    expect(current()).toBe(3);

    await rest(STEP, ['scroll']);
    await rest(2 * STEP, ['scroll']);
    await rest(3 * STEP, ['scroll', 'scrollend']);

    expect(current()).toBe(3);
    expect(changes).toEqual([]);
  });

  it('jumps to a card set from outside without animation under reduced motion', async () => {
    const { clock, media, fixture, scrollTo, current, pointTo } = await setup();
    media.isReduced = true;

    await pointTo(3);
    clock.frame();
    await fixture.whenStable();

    expect(scrollTo).toHaveBeenCalledWith({
      left: 3 * STEP,
      behavior: 'instant',
    });
    expect(current()).toBe(3);
  });

  it('hands the tapped card, the current one or one peeking from the edge', async () => {
    const { fixture, cards, chosen } = await setup({ active: 1 });

    cards[1]?.click();
    cards[2]?.click();
    await fixture.whenStable();

    expect(chosen).toEqual([1, 2]);
  });

  it('scrolls to the card of a tapped dot, and says so once the scroll has ended', async () => {
    const { dots, scrollTo, changes, rest } = await setup();

    dots[3]?.click();

    expect(scrollTo).toHaveBeenCalledWith({
      left: 3 * STEP,
      behavior: 'smooth',
    });
    expect(changes).toEqual([]);

    await rest(3 * STEP);

    expect(changes).toEqual([3]);
  });

  it('jumps to the card of a tapped dot under reduced motion', async () => {
    const { media, dots, scrollTo } = await setup();
    media.isReduced = true;

    dots[1]?.click();

    expect(scrollTo).toHaveBeenCalledWith({ left: STEP, behavior: 'instant' });
  });

  it('settles 120 ms after the last scroll where the browser has no scrollend', async () => {
    const { browserWindow, clock, fixture, changes, rest } = await setup();
    browserWindow.knowsScrollEnd = false;

    await rest(STEP, ['scroll']);
    await rest(2 * STEP, ['scroll']);
    clock.elapse(119);

    expect(changes).toEqual([]);

    clock.elapse(120);
    await fixture.whenStable();

    expect(changes).toEqual([2]);
  });

  it('stays on its card when its width changes', async () => {
    const { observer, track, places, scrollTo, rest } = await setup();
    await rest(2 * STEP);
    observer.resize();
    scrollTo.mockClear();

    layOut(track, places, 400);
    observer.resize();

    expect(scrollTo).toHaveBeenCalledWith({
      left: 2 * (400 - 2 * 48 + 8),
      behavior: 'instant',
    });
  });

  it('never scrolls where no frame ever comes, as on the server', async () => {
    const { host, scrollTo, current, pointTo } = await setup();

    await pointTo(3);

    expect(scrollTo).not.toHaveBeenCalled();
    expect(current()).toBe(3);
    expect(host.querySelectorAll('.card')).toHaveLength(4);
  });
});
