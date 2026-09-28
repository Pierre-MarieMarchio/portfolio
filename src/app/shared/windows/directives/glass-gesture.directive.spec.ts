import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormatCodeService } from '@app/core/services';
import * as glassGestures from '../trackers/glass-gesture.tracker';
import {
  GlassGesturesDirective,
  loadGlassGestures,
} from './glass-gesture.directive';
import { stubMedia, stubViewport } from '@testing/doubles/browser.double';
import { drag, pointer, PointerAt } from '@testing/fixtures/pointer.fixture';

const stubNumber = (
  element: Element,
  key: 'scrollTop' | 'scrollWidth' | 'clientWidth',
  value: number,
): void => {
  Object.defineProperty(element, key, { value, configurable: true });
};

const slow = (dx: number, dy: number): PointerAt[] => [
  { x: 200, y: 100, at: 0 },
  { x: 200 + dx / 2, y: 100 + dy / 2, at: 200 },
  { x: 200 + dx, y: 100 + dy, at: 400 },
];

const isTouchMoveHeld = (on: Element): boolean => {
  const event = new TouchEvent('touchmove', {
    bubbles: true,
    cancelable: true,
  });
  on.dispatchEvent(event);
  return event.defaultPrevented;
};

@Component({
  imports: [GlassGesturesDirective],
  template: `
    <div class="rail">
      <section
        [appGlassGestures]="folded()"
        (glassGesture)="gestures.push($event)"
      >
        <div class="bar" data-glass-zone="bar">
          <span class="grip">grip</span>
          <button type="button">button</button>
        </div>
        <div class="toolbar" data-glass-zone="toolbar">
          <ul class="strip" style="overflow-x: auto">
            <li class="item">item</li>
          </ul>
        </div>
        <div class="body" data-glass-zone="body">
          <p class="text">text</p>
          <button type="button" class="link" (click)="clicks = clicks + 1">
            link
          </button>
        </div>
        <div class="footer">footer</div>
      </section>
    </div>
  `,
})
class GlassHost {
  public readonly folded = signal(false);
  public readonly gestures: string[] = [];
  public clicks = 0;
}

const setup = async ({
  width = 390,
  isReduced = false,
  isFolded = false,
  isLoaded = true,
} = {}) => {
  stubViewport(width, 844);
  stubMedia((query) => query.includes('reduce') && isReduced);
  const code = signal<typeof glassGestures | null>(
    isLoaded ? glassGestures : null,
  );
  const load = vi.fn(() => code.asReadonly());
  TestBed.configureTestingModule({
    imports: [GlassHost],
    providers: [{ provide: FormatCodeService, useValue: { load } }],
  });
  const fixture = TestBed.createComponent(GlassHost);
  fixture.componentInstance.folded.set(isFolded);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  const find = (selector: string): HTMLElement =>
    host.querySelector(selector) as HTMLElement;
  return {
    fixture,
    find,
    drag,
    load,
    arrive: async () => {
      code.set(glassGestures);
      await fixture.whenStable();
    },
    gestures: fixture.componentInstance.gestures,
  };
};

describe('GlassGesturesDirective', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('folds on a pull of 64 px down the bar', async () => {
    const { find, drag, gestures } = await setup();

    drag(find('.grip'), slow(0, 64));

    expect(gestures).toEqual(['fold']);
  });

  it('folds on a short pull down the bar let go fast', async () => {
    const { find, drag, gestures } = await setup();

    drag(find('.grip'), [
      { x: 200, y: 100, at: 0 },
      { x: 200, y: 110, at: 10 },
      { x: 200, y: 130, at: 30 },
    ]);

    expect(gestures).toEqual(['fold']);
  });

  it('lets a short slow pull go back to its place', async () => {
    const { find, drag, gestures } = await setup();
    const section = find('section');

    drag(find('.grip'), slow(0, 40));

    expect(gestures).toEqual([]);
    expect(section.style.transform).toBe('');
    expect(section.classList).toContain('glass-return');
  });

  it('moves the glass down with the finger while it is pulled', async () => {
    const { find } = await setup();
    const grip = find('.grip');
    const section = find('section');

    grip.dispatchEvent(pointer('pointerdown', { x: 200, y: 100, at: 0 }));
    grip.dispatchEvent(pointer('pointermove', { x: 200, y: 130, at: 50 }));

    expect(section.style.transform).toBe('translateY(30px)');
  });

  it('neither follows the finger nor animates back under reduced motion', async () => {
    const { find, drag, gestures } = await setup({ isReduced: true });
    const grip = find('.grip');
    const section = find('section');

    grip.dispatchEvent(pointer('pointerdown', { x: 200, y: 100, at: 0 }));
    grip.dispatchEvent(pointer('pointermove', { x: 200, y: 130, at: 50 }));
    const transform = section.style.transform;
    grip.dispatchEvent(pointer('pointerup', { x: 200, y: 130, at: 400 }));
    drag(grip, slow(0, 64));

    expect(transform).toBe('');
    expect(section.classList).not.toContain('glass-return');
    expect(gestures).toEqual(['fold']);
  });

  it('does not start from a button of the bar', async () => {
    const { find, drag, gestures } = await setup();

    drag(find('button'), slow(0, 120));

    expect(gestures).toEqual([]);
  });

  it('pulls from the body only when the body is at the top of its content', async () => {
    const { find, drag, gestures } = await setup();

    drag(find('.text'), slow(0, 80));
    stubNumber(find('.body'), 'scrollTop', 40);
    drag(find('.text'), slow(0, 80));

    expect(gestures).toEqual(['fold']);
  });

  it('does not fold a raised glass, whose rail has scrolled', async () => {
    const { find, drag, gestures } = await setup();
    stubNumber(find('.rail'), 'scrollTop', 300);

    drag(find('.grip'), slow(0, 120));

    expect(gestures).toEqual([]);
  });

  it('unfolds a folded glass on a lift of 48 px, or on a tap of its bar', async () => {
    const { find, drag, gestures } = await setup({ isFolded: true });

    drag(find('.grip'), slow(0, -48));
    drag(find('.grip'), [{ x: 200, y: 100, at: 1000 }]);

    expect(gestures).toEqual(['unfold', 'unfold']);
  });

  it('turns a swipe on the body or the toolbar into next or previous', async () => {
    const { find, drag, gestures } = await setup();

    drag(find('.text'), slow(-60, 10));
    drag(find('.item'), slow(60, -10));

    expect(gestures).toEqual(['next', 'previous']);
  });

  it('moves the body a little with a swipe, never beyond 24 px', async () => {
    const { find } = await setup();
    const text = find('.text');
    const body = find('.body');

    text.dispatchEvent(pointer('pointerdown', { x: 200, y: 100, at: 0 }));
    text.dispatchEvent(pointer('pointermove', { x: -300, y: 100, at: 50 }));
    const followed = Number.parseFloat(
      body.style.transform.replace('translateX(', ''),
    );
    text.dispatchEvent(pointer('pointerup', { x: -300, y: 100, at: 60 }));

    expect(followed).toBeLessThan(0);
    expect(followed).toBeGreaterThanOrEqual(-24);
    expect(body.style.transform).toBe('');
  });

  it('leaves a swipe to an element that scrolls sideways itself', async () => {
    const { find, drag, gestures } = await setup();
    const strip = find('.strip');
    stubNumber(strip, 'scrollWidth', 600);
    stubNumber(strip, 'clientWidth', 300);

    drag(find('.item'), slow(-80, 0));

    expect(gestures).toEqual([]);
  });

  it('does not swipe from the footer', async () => {
    const { find, drag, gestures } = await setup();

    drag(find('.footer'), slow(-80, 0));

    expect(gestures).toEqual([]);
  });

  it('drops the gesture when a second finger comes down', async () => {
    const { find, gestures } = await setup();
    const text = find('.text');
    const body = find('.body');

    text.dispatchEvent(pointer('pointerdown', { x: 200, y: 100, at: 0 }));
    text.dispatchEvent(pointer('pointermove', { x: 150, y: 100, at: 50 }));
    text.dispatchEvent(
      pointer('pointerdown', { x: 260, y: 100, at: 60, id: 2 }),
    );
    text.dispatchEvent(pointer('pointermove', { x: 100, y: 100, at: 90 }));
    text.dispatchEvent(pointer('pointerup', { x: 100, y: 100, at: 400 }));

    expect(gestures).toEqual([]);
    expect(body.style.transform).toBe('');
  });

  it('holds the touch from the native scroll only while the drag is its own', async () => {
    const { find } = await setup();
    const grip = find('.grip');
    const text = find('.text');

    grip.dispatchEvent(pointer('pointerdown', { x: 200, y: 100, at: 0 }));
    grip.dispatchEvent(pointer('pointermove', { x: 200, y: 120, at: 20 }));
    const isPullHeld = isTouchMoveHeld(grip);
    grip.dispatchEvent(pointer('pointerup', { x: 200, y: 120, at: 400 }));
    text.dispatchEvent(pointer('pointerdown', { x: 200, y: 300, at: 500 }));
    text.dispatchEvent(pointer('pointermove', { x: 200, y: 260, at: 520 }));
    const isRiseHeld = isTouchMoveHeld(text);

    expect(isPullHeld).toBe(true);
    expect(isRiseHeld).toBe(false);
  });

  it('does nothing outside the phone format', async () => {
    const { find, drag, gestures } = await setup({ width: 1200 });

    drag(find('.grip'), slow(0, 120));
    drag(find('.text'), slow(-120, 0));

    expect(gestures).toEqual([]);
    expect(find('section').style.transform).toBe('');
  });

  it('swallows the click that follows a drag of more than 6 px, once', async () => {
    const { fixture, find, drag } = await setup();
    const link = find('.link');

    drag(link, slow(-3, 4));
    link.click();
    drag(link, slow(-40, 0));
    link.click();
    link.click();

    expect(fixture.componentInstance.clicks).toBe(2);
  });

  it('swallows the click that follows a second finger', async () => {
    const { fixture, find } = await setup();
    const link = find('.link');

    link.dispatchEvent(pointer('pointerdown', { x: 200, y: 100, at: 0 }));
    link.dispatchEvent(
      pointer('pointerdown', { x: 240, y: 100, at: 10, id: 2 }),
    );
    link.dispatchEvent(pointer('pointerup', { x: 240, y: 100, at: 20, id: 2 }));
    link.dispatchEvent(pointer('pointerup', { x: 200, y: 100, at: 30 }));
    link.click();

    expect(fixture.componentInstance.clicks).toBe(0);
  });

  it('keeps every click outside the phone format', async () => {
    const { fixture, find, drag } = await setup({ width: 1200 });
    const link = find('.link');

    drag(link, slow(-80, 0));
    link.click();

    expect(fixture.componentInstance.clicks).toBe(1);
  });

  it('asks for its code through the format code loader, for the phone', async () => {
    const { load } = await setup();

    expect(load).toHaveBeenCalledWith(['phone'], loadGlassGestures);
  });

  it('holds a gesture made before its code arrives, then plays it', async () => {
    const { find, drag, gestures, arrive } = await setup({ isLoaded: false });

    drag(find('.grip'), slow(0, 120));

    expect(gestures).toEqual([]);

    await arrive();

    expect(gestures).toEqual(['fold']);
  });

  it('swallows a click that followed a drag made before its code arrived', async () => {
    const { fixture, find, drag, arrive } = await setup({ isLoaded: false });
    const link = find('.link');

    drag(link, slow(-40, 0));
    await arrive();
    link.click();
    link.click();

    expect(fixture.componentInstance.clicks).toBe(1);
  });

  it('holds nothing outside the phone format', async () => {
    const { find, drag, gestures, arrive } = await setup({
      width: 1200,
      isLoaded: false,
    });

    drag(find('.grip'), slow(0, 120));
    await arrive();

    expect(gestures).toEqual([]);
  });
});
