import { Component, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormatCodeService } from '@app/core/services';
import { WindowComponent } from '../components/window/window.component';
import { WindowAnchor, WindowSize } from '../models/window.model';
import { WINDOW_TEXTS, WindowTexts } from '../ports';
import { WindowStackService } from '../services/window-stack.service';
import { KeptWindowDirective } from './kept-window.directive';
import { StackedWindowDirective } from './stacked-window.directive';
import {
  loadWindowFrame,
  WindowFrameDirective,
} from './window-frame.directive';
import {
  resizeTo,
  stubMedia,
  stubViewport,
} from '@testing/doubles/browser.double';
import { firePointer, PointerAt } from '@testing/fixtures/pointer.fixture';
import { provideTexts } from '@testing/fixtures/texts.fixture';

const GUTTER = 44;
const TOP = 100;
const NATURAL = { width: 400, height: 300 };
const TRANSLATE = /translate\((-?[\d.]+)px, ?(-?[\d.]+)px\)/;

const layOutFromTheRight = (slot: HTMLElement): void => {
  slot.getBoundingClientRect = () => {
    const width = Number.parseFloat(slot.style.width) || NATURAL.width;
    const height = Number.parseFloat(slot.style.height) || NATURAL.height;
    const [, dx = '0', dy = '0'] = TRANSLATE.exec(slot.style.transform) ?? [];
    return new DOMRect(
      window.innerWidth - GUTTER - width + Number(dx),
      TOP + Number(dy),
      width,
      height,
    );
  };
};

@Component({
  imports: [WindowFrameDirective, WindowComponent],
  template: `
    <div class="slot" appWindowFrame style="--window-reserve: 76px">
      <app-window
        heading="Console"
        [size]="size()"
        [anchor]="anchor()"
        [preview]="preview()"
        [stableHeight]="stableHeight()"
      >
        <div body>BODY-MARK</div>
      </app-window>
    </div>
  `,
})
class Host {
  public readonly size = signal<WindowSize>('m');
  public readonly anchor = signal<WindowAnchor>('top');
  public readonly preview = signal(false);
  public readonly stableHeight = signal(false);
}

const mouse = (at: PointerAt): PointerAt => ({ kind: 'mouse', ...at });

const layOutSection = (
  section: HTMLElement,
  layout: { offsetTop: number; offsetHeight?: number },
): void => {
  for (const [key, value] of Object.entries(layout)) {
    Object.defineProperty(section, key, { value, configurable: true });
  }
};

const texts = (): WindowTexts => TestBed.inject(WINDOW_TEXTS)();

const mount = async (providers: unknown[] = []) => {
  stubViewport(1200, 800);
  TestBed.configureTestingModule({
    imports: [Host],
    providers: [provideTexts(), ...(providers as never[])],
  });
  const fixture = TestBed.createComponent(Host);
  const host = fixture.nativeElement as HTMLElement;
  const slot = host.querySelector<HTMLElement>('.slot') as HTMLElement;
  layOutFromTheRight(slot);
  await fixture.whenStable();
  await loadWindowFrame();
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
  const settle = () => fixture.whenStable();
  const drag = async (
    from: Element,
    path: readonly PointerAt[],
  ): Promise<void> => {
    const [first, ...moves] = path;
    firePointer(from, 'pointerdown', mouse(first ?? {}));
    for (const move of moves) {
      firePointer(window, 'pointermove', mouse(move));
    }
    firePointer(window, 'pointerup', mouse(moves.at(-1) ?? {}));
    await settle();
  };
  const bar = (): Element => host.querySelector('.titlebar h2') as Element;
  const edge = (name: string): Element =>
    host.querySelector(`[data-edge="${name}"]`) as Element;
  const control = (name: string): HTMLButtonElement =>
    [...host.querySelectorAll('button')].find(
      (button) => button.getAttribute('aria-label') === name,
    ) as HTMLButtonElement;
  const doubleClick = async (on = '.titlebar'): Promise<void> => {
    host
      .querySelector(on)
      ?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await settle();
  };
  const frame = () => ({
    mode: slot.dataset['frame'] ?? null,
    transform: slot.style.transform,
    width: slot.style.width,
    height: slot.style.height,
  });
  const directive = (): WindowFrameDirective =>
    fixture.debugElement
      .query(By.directive(WindowFrameDirective))
      .injector.get(WindowFrameDirective);
  return {
    fixture,
    host,
    slot,
    settle,
    drag,
    bar,
    edge,
    control,
    doubleClick,
    frame,
    directive,
  };
};

const mountHost = async <T>(
  component: new () => T,
  layOut: (host: HTMLElement) => void,
) => {
  const frames: FrameRequestCallback[] = [];
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((fn) => {
    frames.push(fn);
    return frames.length;
  });
  stubViewport(1200, 800);
  TestBed.configureTestingModule({
    imports: [component],
    providers: [provideTexts()],
  });
  const fixture = TestBed.createComponent(component);
  const host = fixture.nativeElement as HTMLElement;
  layOut(host);
  await fixture.whenStable();
  await loadWindowFrame();
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
  const nextFrame = async (): Promise<void> => {
    for (const next of frames.splice(0)) {
      next(0);
    }
    await fixture.whenStable();
  };
  const show = async (
    target: WritableSignal<boolean>,
    isShown: boolean,
  ): Promise<void> => {
    target.set(isShown);
    await fixture.whenStable();
    await nextFrame();
    await nextFrame();
  };
  const dragBar = async (
    slot: HTMLElement,
    path: readonly PointerAt[],
  ): Promise<void> => {
    const bar = slot.querySelector('.titlebar h2') as Element;
    const [first, ...moves] = path;
    firePointer(bar, 'pointerdown', { kind: 'mouse', ...first });
    for (const move of moves) {
      firePointer(window, 'pointermove', { kind: 'mouse', ...move });
    }
    firePointer(window, 'pointerup', {
      kind: 'mouse',
      ...moves.at(-1),
    });
    await fixture.whenStable();
  };
  const transformOf = (slot: HTMLElement): string => slot.style.transform;
  return { fixture, host, show, dragBar, transformOf };
};

describe('WindowFrameDirective', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('its code', () => {
    it('asks for it at the desktop and tablet formats only, and lets a gesture go until it is there', async () => {
      const load = vi.fn(() => signal(null));
      const { bar, drag, frame } = await mount([
        { provide: FormatCodeService, useValue: { load } },
      ]);

      await drag(bar(), [
        { x: 800, y: 110 },
        { x: 850, y: 140 },
      ]);

      expect(load).toHaveBeenCalledWith(['desktop', 'tablet'], loadWindowFrame);
      expect(frame().transform).toBe('');
    });
  });

  describe('moved by its title bar', () => {
    it('follows the pointer and stays there, free', async () => {
      const { bar, drag, frame } = await mount();

      await drag(bar(), [
        { x: 800, y: 110 },
        { x: 850, y: 140 },
      ]);

      expect(frame()).toEqual({
        mode: 'free',
        transform: 'translate(50px,30px)',
        width: '',
        height: '',
      });
    });

    it('publishes the rectangle it is dragged to, once per move, then none once dropped', async () => {
      const { bar, drag, directive } = await mount();
      const heardRects = vi.fn();
      directive().onLive(heardRects);

      await drag(bar(), [
        { x: 800, y: 110 },
        { x: 850, y: 140 },
        { x: 860, y: 150 },
      ]);

      expect(heardRects).toHaveBeenCalledTimes(3);
      expect(heardRects.mock.calls.at(-2)?.[0]).toMatchObject({
        x: 1200 - GUTTER - NATURAL.width + 60,
        y: TOP + 40,
      });
      expect(heardRects.mock.calls.at(-1)?.[0]).toBeNull();
    });

    it('keeps its bar below the real top bar, not a fixed margin', async () => {
      const { slot, bar, drag, frame } = await mount();
      slot.style.setProperty('--head-bottom', '400px');

      await drag(bar(), [
        { x: 800, y: 110 },
        { x: 800, y: 50 },
      ]);

      expect(frame().transform).toBe('translate(0px,312px)');
    });

    it('keeps its bar above the dock reserve, not a fixed margin', async () => {
      const { host, bar, drag, frame } = await mount();
      const titlebar = host.querySelector('.titlebar') as HTMLElement;
      titlebar.getBoundingClientRect = () => new DOMRect(0, 0, 400, 48);

      await drag(bar(), [
        { x: 800, y: 110 },
        { x: 800, y: 2000 },
      ]);

      expect(frame().transform).toBe('translate(0px,576px)');
    });

    it('does not move for a press without a drag, nor from a button', async () => {
      const { bar, drag, control, frame } = await mount();

      await drag(bar(), [
        { x: 800, y: 110 },
        { x: 802, y: 111 },
      ]);
      await drag(control(texts().close), [
        { x: 1100, y: 110 },
        { x: 900, y: 300 },
      ]);

      expect(frame()).toEqual({
        mode: null,
        transform: '',
        width: '',
        height: '',
      });
    });

    it('outlines the half of the screen it would take at the left edge, and takes it on release', async () => {
      const { slot, bar, frame, settle } = await mount();
      firePointer(bar(), 'pointerdown', { kind: 'mouse', x: 800, y: 110 });
      firePointer(window, 'pointermove', { kind: 'mouse', x: 5, y: 300 });
      const outline = slot.nextElementSibling as HTMLElement;

      expect(outline.getAttribute('aria-hidden')).toBe('true');
      expect(outline.style.opacity).toBe('1');
      expect(outline.style.backdropFilter).toBe('');
      expect([outline.style.width, outline.style.height]).toEqual([
        '550px',
        '624px',
      ]);

      firePointer(window, 'pointerup', { kind: 'mouse', x: 5, y: 300 });
      await settle();

      expect(outline.isConnected).toBe(false);
      expect(frame()).toEqual({
        mode: 'left',
        transform: 'translate(-562px,0px)',
        width: '550px',
        height: '624px',
      });
    });

    it.each([
      ['right', { x: 1199, y: 300 }, 'translate(0px,0px)', '550px'],
      ['full', { x: 800, y: 4 }, 'translate(0px,0px)', '1112px'],
    ])('takes the %s zone at its edge', async (mode, to, transform, width) => {
      const { bar, drag, frame } = await mount();

      await drag(bar(), [{ x: 800, y: 110 }, to]);

      expect(frame()).toEqual({ mode, transform, width, height: '624px' });
    });

    it('hides the outline when the pointer leaves the edge', async () => {
      const { slot, bar, frame, settle } = await mount();
      firePointer(bar(), 'pointerdown', mouse({ x: 800, y: 110 }));
      firePointer(window, 'pointermove', mouse({ x: 5, y: 300 }));
      firePointer(window, 'pointermove', mouse({ x: 400, y: 300 }));

      expect((slot.nextElementSibling as HTMLElement).style.opacity).toBe('0');

      firePointer(window, 'pointerup', mouse({ x: 400, y: 300 }));
      await settle();
      expect(frame().mode).toBe('free');
    });

    it('gives a snapped window back its former size under the pointer as it leaves', async () => {
      const { bar, drag, frame } = await mount();
      await drag(bar(), [
        { x: 800, y: 110 },
        { x: 5, y: 300 },
      ]);

      await drag(bar(), [
        { x: 300, y: 110 },
        { x: 400, y: 200 },
      ]);

      expect(frame()).toEqual({
        mode: 'free',
        transform: 'translate(-542px,90px)',
        width: '',
        height: '',
      });
    });
  });

  describe('text selection', () => {
    afterEach(() => {
      document.body.style.userSelect = '';
    });

    it('blocks it for the length of a drag by the title bar, and gives it back once dropped', async () => {
      const { bar, settle } = await mount();

      firePointer(bar(), 'pointerdown', mouse({ x: 800, y: 110 }));
      firePointer(window, 'pointermove', mouse({ x: 850, y: 140 }));
      expect(document.body.style.userSelect).toBe('none');

      firePointer(window, 'pointerup', mouse({ x: 850, y: 140 }));
      await settle();

      expect(document.body.style.userSelect).toBe('');
    });

    it('blocks it for the length of a resize by an edge, and gives it back once dropped', async () => {
      const { edge, settle } = await mount();

      firePointer(edge('se'), 'pointerdown', mouse({ x: 1156, y: 400 }));
      firePointer(window, 'pointermove', mouse({ x: 1200, y: 450 }));
      expect(document.body.style.userSelect).toBe('none');

      firePointer(window, 'pointerup', mouse({ x: 1200, y: 450 }));
      await settle();

      expect(document.body.style.userSelect).toBe('');
    });
  });

  describe('resized by an edge', () => {
    it.each([
      ['grows from its corner', { x: 656, y: 500 }, '500px', '400px'],
      ['keeps 320 × 200 at least', { x: 1056, y: 150 }, '320px', '200px'],
      [
        'keeps within the screen and its reserve',
        { x: -1244, y: 2400 },
        '1112px',
        '624px',
      ],
    ])('%s', async (_case, to, width, height) => {
      const { host, edge, drag, frame } = await mount();

      await drag(edge('sw'), [{ x: 756, y: 400 }, to]);

      expect(frame()).toEqual({
        mode: 'free',
        transform: 'translate(0px,0px)',
        width,
        height,
      });
      expect(host.querySelector<HTMLElement>('.window')?.style.maxHeight).toBe(
        '',
      );
    });

    it('offers an edge on each side but the title bar, and a corner at the bottom on each side', async () => {
      const { host } = await mount();

      expect(
        [...host.querySelectorAll('[data-edge]')].map(
          (each) => (each as HTMLElement).dataset['edge'],
        ),
      ).toEqual(['e', 'w', 's', 'se', 'sw']);
    });
  });

  describe('maximized', () => {
    it('by a double click on its title bar, and back', async () => {
      const { control, doubleClick, frame } = await mount();

      await doubleClick();

      expect(frame()).toEqual({
        mode: 'full',
        transform: 'translate(0px,0px)',
        width: '1112px',
        height: '624px',
      });
      expect(control(texts().restore)).toBeTruthy();

      await doubleClick();

      expect(frame()).toEqual({
        mode: null,
        transform: '',
        width: '',
        height: '',
      });
      expect(control(texts().maximize)).toBeTruthy();
    });

    it('by its button, back to where it had been moved', async () => {
      const { bar, drag, control, frame, settle } = await mount();
      await drag(bar(), [
        { x: 800, y: 110 },
        { x: 850, y: 140 },
      ]);

      control(texts().maximize).click();
      await settle();
      expect(frame().mode).toBe('full');
      control(texts().restore).click();
      await settle();

      expect(frame()).toEqual({
        mode: 'free',
        transform: 'translate(50px,30px)',
        width: '',
        height: '',
      });
    });

    it('fits the screen again when it changes', async () => {
      const { doubleClick, frame, settle } = await mount();
      await doubleClick();

      resizeTo(1000, 700);
      await settle();

      expect([frame().width, frame().height]).toEqual(['912px', '524px']);
    });

    it.each([
      ['the title', '.titlebar h2'],
      ['an empty stretch of the bar', '.spacer'],
      ['the bar near its right edge, outside the buttons', '.meta'],
    ])(
      'by a double click anywhere on the bar, including %s',
      async (_case, on) => {
        const { doubleClick, frame } = await mount();

        await doubleClick(on);

        expect(frame().mode).toBe('full');
      },
    );

    it('never maximizes the preview, by its button or a double click', async () => {
      const { fixture, host, doubleClick, frame } = await mount();
      fixture.componentInstance.preview.set(true);
      await fixture.whenStable();

      expect(
        [...host.querySelectorAll('button')].some((button) =>
          [texts().maximize, texts().restore].includes(
            button.getAttribute('aria-label') ?? '',
          ),
        ),
      ).toBe(false);

      await doubleClick();

      expect(frame().mode).toBeNull();
    });
  });

  describe('at the keyboard', () => {
    it('offers no arrow move or resize control, only maximize and close', async () => {
      const { host } = await mount();

      expect(
        [...host.querySelectorAll('.titlebar button')].map((button) =>
          button.getAttribute('aria-label'),
        ),
      ).toEqual([texts().maximize, texts().close]);
    });
  });

  describe('animated', () => {
    it('marks the frame as animating while it maximizes, and clears it after the transition', async () => {
      stubMedia(() => false);
      const { slot, control, frame, settle } = await mount();
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

      control(texts().maximize).click();
      await settle();

      expect(frame().mode).toBe('full');
      expect(slot.dataset['frameAnimating']).toBe('true');

      vi.advanceTimersByTime(280);
      await settle();

      expect(slot.dataset['frameAnimating']).toBeUndefined();
    });

    it('does not animate in reduced motion', async () => {
      stubMedia((query) => query === '(prefers-reduced-motion: reduce)');
      const { slot, control, settle } = await mount();

      control(texts().maximize).click();
      await settle();

      expect(slot.dataset['frameAnimating']).toBeUndefined();
    });
  });

  describe('its height', () => {
    it.each([
      { size: 's', height: 2000, top: 100, maxHeight: '300px' },
      { size: 'm', height: 2000, top: 100, maxHeight: '470px' },
      { size: 'l', height: 2000, top: 100, maxHeight: '920px' },
      { size: 'l', height: 500, top: 100, maxHeight: '324px' },
      { size: 'm', height: 800, top: 750, maxHeight: '200px' },
    ] as const)(
      'keeps a $size window in $height px under its top at $top to $maxHeight',
      async ({ size, height, top, maxHeight }) => {
        const { fixture, host, settle } = await mount();
        const section = host.querySelector<HTMLElement>(
          '.window',
        ) as HTMLElement;
        layOutSection(section, { offsetTop: top });

        fixture.componentInstance.size.set(size);
        resizeTo(1200, height);
        await settle();

        expect(section.style.maxHeight).toBe(maxHeight);
      },
    );

    it('paints a fixed height instead of a cap when asked for a stable height', async () => {
      const { fixture, host, settle } = await mount();
      const section = host.querySelector<HTMLElement>('.window') as HTMLElement;
      layOutSection(section, { offsetTop: 100 });

      fixture.componentInstance.stableHeight.set(true);
      resizeTo(1200, 2000);
      await settle();

      expect(section.style.height).toBe('470px');
      expect(section.style.maxHeight).toBe('');
    });

    it('clears the stable height once the reader resizes the window', async () => {
      const { fixture, host, edge, drag, settle } = await mount();
      const section = host.querySelector<HTMLElement>('.window') as HTMLElement;
      layOutSection(section, { offsetTop: 100 });
      fixture.componentInstance.stableHeight.set(true);
      await settle();

      await drag(edge('s'), [
        { x: 756, y: 400 },
        { x: 756, y: 500 },
      ]);

      expect(section.style.height).toBe('');
      expect(section.style.maxHeight).toBe('');
    });

    it('takes its room above its bottom edge when anchored at the bottom', async () => {
      const { fixture, host, settle } = await mount();
      const section = host.querySelector<HTMLElement>('.window') as HTMLElement;
      layOutSection(section, { offsetTop: 100, offsetHeight: 300 });

      fixture.componentInstance.anchor.set('bottom');
      resizeTo(1200, 2000);
      await settle();

      expect(section.style.maxHeight).toBe('324px');
    });
  });

  describe('at the phone format', () => {
    it('lets its frame go, with its edges and its frame controls', async () => {
      const { host, doubleClick, frame, settle } = await mount();
      await doubleClick();

      resizeTo(390, 844);
      await settle();

      expect(frame()).toEqual({
        mode: null,
        transform: '',
        width: '',
        height: '',
      });
      expect(host.querySelector('[data-edge]')).toBeNull();
      expect(host.querySelector<HTMLElement>('.window')?.style.maxHeight).toBe(
        '',
      );
      expect(
        [...host.querySelectorAll('button')].map((button) =>
          button.getAttribute('aria-label'),
        ),
      ).toEqual([texts().close]);
    });

    it('does not move', async () => {
      const { bar, drag, frame, settle } = await mount();
      resizeTo(390, 844);
      await settle();

      await drag(bar(), [
        { x: 100, y: 110 },
        { x: 150, y: 140 },
      ]);

      expect(frame().transform).toBe('');
    });
  });

  describe('placed at its usual place whatever the windows already shown', () => {
    @Component({
      imports: [
        KeptWindowDirective,
        StackedWindowDirective,
        WindowComponent,
        WindowFrameDirective,
      ],
      providers: [WindowStackService],
      template: `
        <div
          class="slot slot-a"
          appStackedWindow="a"
          appWindowFrame
          appKeptWindow
          [shown]="shownA()"
          style="--window-reserve: 76px"
        >
          <app-window heading="A"><div body>A-BODY</div></app-window>
        </div>
        <div
          class="slot slot-b"
          appStackedWindow="b"
          appWindowFrame
          appKeptWindow
          [shown]="shownB()"
          style="--window-reserve: 76px"
        >
          <app-window heading="B"><div body>B-BODY</div></app-window>
        </div>
      `,
    })
    class ShownHost {
      public readonly shownA = signal(true);
      public readonly shownB = signal(false);
    }

    const NATURAL_RECT = new DOMRect(800, 100, 400, 300);

    const layOutAt = (slot: HTMLElement, natural: DOMRect): void => {
      slot.getBoundingClientRect = () => {
        const width = Number.parseFloat(slot.style.width) || natural.width;
        const height = Number.parseFloat(slot.style.height) || natural.height;
        const [, dx = '0', dy = '0'] =
          TRANSLATE.exec(slot.style.transform) ?? [];
        return new DOMRect(
          natural.x + Number(dx),
          natural.y + Number(dy),
          width,
          height,
        );
      };
    };

    const mountShown = async () => {
      const mounted = await mountHost(ShownHost, (host) => {
        layOutAt(host.querySelector('.slot-a') as HTMLElement, NATURAL_RECT);
        layOutAt(host.querySelector('.slot-b') as HTMLElement, NATURAL_RECT);
      });
      const slotA = mounted.host.querySelector('.slot-a') as HTMLElement;
      const slotB = mounted.host.querySelector('.slot-b') as HTMLElement;
      return { ...mounted, slotA, slotB };
    };

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('opens at its default place over the window already on screen', async () => {
      const { fixture, slotA, slotB, show, transformOf } = await mountShown();

      await show(fixture.componentInstance.shownB, true);

      expect(transformOf(slotB)).toBe('');
      expect(slotB.getBoundingClientRect()).toEqual(
        slotA.getBoundingClientRect(),
      );
    });

    it('takes its default place when it is the only window shown', async () => {
      const { slotA, transformOf } = await mountShown();

      expect(transformOf(slotA)).toBe('');
    });

    it('never moves a window the reader has already placed', async () => {
      const { fixture, slotB, show, dragBar, transformOf } = await mountShown();
      await show(fixture.componentInstance.shownB, true);

      await dragBar(slotB, [
        { x: 800, y: 110 },
        { x: 850, y: 140 },
      ]);
      const placed = transformOf(slotB);
      expect(placed).not.toBe('');

      await show(fixture.componentInstance.shownB, false);
      await show(fixture.componentInstance.shownB, true);

      expect(transformOf(slotB)).toBe(placed);
    });
  });
});
