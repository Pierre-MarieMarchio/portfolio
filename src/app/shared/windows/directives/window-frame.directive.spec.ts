import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormatCodeService } from '@app/core/services';
import { WindowComponent } from '../components/window/window.component';
import { WindowAnchor, WindowSize } from '../models/window.model';
import { WINDOW_TEXTS, WindowTexts } from '../ports';
import {
  loadWindowFrame,
  WindowFrameDirective,
} from './window-frame.directive';
import { resizeTo, stubViewport } from '@testing/doubles/browser.double';
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
  const press = async (
    button: Element,
    key: string,
    isShifted = false,
  ): Promise<KeyboardEvent> => {
    const event = new KeyboardEvent('keydown', {
      key,
      shiftKey: isShifted,
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(event);
    await settle();
    return event;
  };
  const doubleClick = async (): Promise<void> => {
    host
      .querySelector('.titlebar')
      ?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await settle();
  };
  const frame = () => ({
    mode: slot.dataset['frame'] ?? null,
    transform: slot.style.transform,
    width: slot.style.width,
    height: slot.style.height,
  });
  return {
    fixture,
    host,
    slot,
    settle,
    drag,
    bar,
    edge,
    control,
    press,
    doubleClick,
    frame,
  };
};

describe('WindowFrameDirective', () => {
  const heard = vi.fn();

  beforeEach(() => {
    document.addEventListener('keydown', heard);
  });

  afterEach(() => {
    document.removeEventListener('keydown', heard);
    heard.mockReset();
    vi.unstubAllGlobals();
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
  });

  describe('at the keyboard', () => {
    it('moves by 8 px an arrow, by 64 with Shift, and ends on Escape without closing anything', async () => {
      const { control, press, frame } = await mount();
      const move = control(texts().move);

      await press(move, 'ArrowRight');
      expect(frame().transform).toBe('translate(8px,0px)');
      expect(move.getAttribute('aria-pressed')).toBe('true');

      await press(move, 'ArrowDown', true);
      expect(frame().transform).toBe('translate(8px,64px)');

      const escape = await press(move, 'Escape');
      expect(move.getAttribute('aria-pressed')).toBe('false');
      expect(escape.defaultPrevented).toBe(true);
      expect(
        heard.mock.calls.map(([event]) => (event as KeyboardEvent).key),
      ).not.toContain('Escape');
    });

    it('keeps its bar below the real top bar when moved by an arrow', async () => {
      const { slot, control, press, frame } = await mount();
      slot.style.setProperty('--head-bottom', '600px');
      const move = control(texts().move);

      await press(move, 'ArrowUp', true);
      await press(move, 'ArrowUp', true);

      expect(frame().transform).toBe('translate(0px,512px)');
    });

    it('lets Escape through when it is not moving', async () => {
      const { control, press } = await mount();

      await press(control(texts().move), 'Escape');

      expect(heard).toHaveBeenCalledTimes(1);
    });

    it('resizes by an arrow, growing where there is room', async () => {
      const { control, press, frame } = await mount();
      const resize = control(texts().resize);

      await press(resize, 'ArrowDown');
      expect([frame().width, frame().height]).toEqual(['400px', '308px']);

      await press(resize, 'ArrowRight', true);
      expect(frame()).toEqual({
        mode: 'free',
        transform: 'translate(0px,0px)',
        width: '464px',
        height: '308px',
      });

      const enter = await press(resize, 'Enter');
      expect(enter.defaultPrevented).toBe(true);
      expect(resize.getAttribute('aria-pressed')).toBe('false');
    });

    it('describes the keys of its move and resize controls', async () => {
      const { host, control } = await mount();

      for (const [name, keys] of [
        [texts().move, texts().moveKeys],
        [texts().resize, texts().resizeKeys],
      ] as const) {
        const id = control(name).getAttribute('aria-describedby') ?? '';
        expect(host.querySelector(`[id="${id}"]`)?.textContent?.trim()).toBe(
          keys,
        );
      }
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
      ).toEqual([texts().phone.pin, texts().close]);
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
});
