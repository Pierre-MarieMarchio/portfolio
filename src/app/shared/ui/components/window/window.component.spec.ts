import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WindowComponent } from './window.component';
import { WindowSize } from '../../models/window.model';
import { provideTexts } from '@testing/fixtures/texts.fixture';

const PIN_OFF_LABEL =
  'Épingler : garder la fenêtre ouverte en changeant de page';
const PIN_ON_LABEL = 'Détacher : la fenêtre se refermera en changeant de page';
const COLLAPSE_OFF_LABEL = 'Replier la fenêtre';
const COLLAPSE_ON_LABEL = 'Déplier la fenêtre';
const CLOSE_LABEL = 'Fermer la fenêtre';

const CAPS: Record<WindowSize, number> = { s: 300, m: 470, l: 920 };

/** A rect stub good enough for jsdom, which never lays anything out. */
const stubRect = (
  el: Element,
  rect: { top: number; left: number; width: number; height: number },
): (() => void) => {
  const original = el.getBoundingClientRect.bind(el);
  const domRect: DOMRect = {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    x: rect.left,
    y: rect.top,
    toJSON: () => ({}),
  };

  el.getBoundingClientRect = () => domRect;

  return () => {
    el.getBoundingClientRect = original;
  };
};

/** `window.innerWidth`/`innerHeight` are read-only getters: redefine, then restore. */
const stubViewport = (width: number, height: number): (() => void) => {
  const widthDescriptor = Object.getOwnPropertyDescriptor(window, 'innerWidth');
  const heightDescriptor = Object.getOwnPropertyDescriptor(
    window,
    'innerHeight',
  );

  Object.defineProperty(window, 'innerWidth', {
    value: width,
    configurable: true,
  });
  Object.defineProperty(window, 'innerHeight', {
    value: height,
    configurable: true,
  });

  return () => {
    if (widthDescriptor) {
      Object.defineProperty(window, 'innerWidth', widthDescriptor);
    }
    if (heightDescriptor) {
      Object.defineProperty(window, 'innerHeight', heightDescriptor);
    }
  };
};

/** jsdom 30 ships `PointerEvent`; fall back to `MouseEvent` if it ever does not. */
const pointerEvent = (
  type: string,
  init: { clientX: number; clientY: number; button?: number },
): Event => {
  const options = { bubbles: true, cancelable: true, ...init };

  return typeof PointerEvent === 'function'
    ? new PointerEvent(type, options)
    : new MouseEvent(type, options);
};

@Component({
  selector: 'app-host-window-slots',
  standalone: true,
  imports: [WindowComponent],
  template: `
    <app-window [heading]="'Console'">
      <div toolbar>TOOLBAR-MARK</div>
      <span>DEFAULT-MARK</span>
      <div body>BODY-MARK</div>
      <div footer>FOOTER-MARK</div>
    </app-window>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostWindowSlots {}

@Component({
  selector: 'app-host-window-render-count',
  standalone: true,
  imports: [WindowComponent],
  template: `
    <app-window [heading]="'Console'">
      <div body>{{ renderBody() }}</div>
    </app-window>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostWindowRenderCount {
  private calls = 0;

  public renderBody(): number {
    this.calls += 1;
    return this.calls;
  }
}

const mount = async (): Promise<{
  fixture: ComponentFixture<WindowComponent>;
  host: HTMLElement;
  section: HTMLElement;
}> => {
  TestBed.configureTestingModule({
    imports: [WindowComponent],
    providers: [provideTexts()],
  });

  const fixture = TestBed.createComponent(WindowComponent);
  fixture.componentRef.setInput('heading', 'Console');
  const host = fixture.nativeElement as HTMLElement;
  const section = host.querySelector('.window') as HTMLElement;
  await fixture.whenStable();

  return { fixture, host, section };
};

const titlebarButtons = (host: HTMLElement): HTMLButtonElement[] => [
  ...host.querySelectorAll<HTMLButtonElement>('.titlebar button'),
];

/** Indexed access with `noUncheckedIndexedAccess`: fail loudly, not with `undefined`. */
const at = <T>(items: readonly T[], index: number): T => {
  const item = items[index];
  if (item === undefined) {
    throw new Error(`expected an item at index ${String(index)}, found none`);
  }
  return item;
};

describe('WindowComponent', () => {
  const restorers: Array<() => void> = [];

  afterEach(() => {
    while (restorers.length > 0) {
      restorers.pop()?.();
    }
  });

  /** The regression `heading` exists for: `title` was a native tooltip. */
  it('writes no title attribute on its host when given a heading in a template', async () => {
    @Component({
      imports: [WindowComponent],
      template: '<app-window heading="À propos" />',
    })
    class Host {}

    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideTexts()],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = (fixture.nativeElement as HTMLElement).querySelector(
      'app-window',
    );

    expect(element?.hasAttribute('title')).toBe(false);
    expect(element?.querySelector('h2')?.textContent).toBe('À propos');
  });

  it('names the section from the label input, falling back to the heading', async () => {
    const { fixture, section } = await mount();

    expect(section.getAttribute('aria-label')).toBe('Console');

    fixture.componentRef.setInput('label', 'Console des expériences');
    await fixture.whenStable();

    expect(section.getAttribute('aria-label')).toBe('Console des expériences');
  });

  it('orders the title bar: decorative square, title, meta, then the buttons', async () => {
    const { fixture, host } = await mount();
    fixture.componentRef.setInput('meta', '3 éléments');
    await fixture.whenStable();

    const titlebar = host.querySelector('.titlebar') as HTMLElement;
    const children = [...titlebar.children];
    const h2Index = children.findIndex((el) => el.tagName === 'H2');
    const metaIndex = children.findIndex((el) => el.classList.contains('meta'));
    const firstButtonIndex = children.findIndex(
      (el) => el.tagName === 'BUTTON',
    );

    expect(at(children, 0).getAttribute('aria-hidden')).toBe('true');
    expect(h2Index).toBeGreaterThan(0);
    expect(at(children, h2Index).textContent?.trim()).toBe('Console');
    expect(metaIndex).toBeGreaterThan(h2Index);
    expect(at(children, metaIndex).textContent?.trim()).toBe('3 éléments');
    expect(firstButtonIndex).toBeGreaterThan(metaIndex);
  });

  it('renders the meta text, empty by default', async () => {
    const { host, fixture } = await mount();

    expect(host.querySelector('.meta')?.textContent?.trim()).toBe('');

    fixture.componentRef.setInput('meta', 'Mis à jour hier');
    await fixture.whenStable();

    expect(host.querySelector('.meta')?.textContent?.trim()).toBe(
      'Mis à jour hier',
    );
  });

  describe('pin button', () => {
    it('starts unpinned, and only the pinned input changes its glyph and label', async () => {
      const { fixture, host } = await mount();
      const pin = at(titlebarButtons(host), 0);

      expect(pin.getAttribute('aria-pressed')).toBe('false');
      expect(pin.textContent?.trim()).toBe('○');
      expect(pin.getAttribute('aria-label')).toBe(PIN_OFF_LABEL);
      expect(pin.getAttribute('title')).toBe(PIN_OFF_LABEL);

      pin.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await fixture.whenStable();

      // A click alone never flips the glyph: only the `pinned` input does.
      expect(pin.getAttribute('aria-pressed')).toBe('false');
      expect(pin.textContent?.trim()).toBe('○');

      fixture.componentRef.setInput('pinned', true);
      await fixture.whenStable();

      expect(pin.getAttribute('aria-pressed')).toBe('true');
      expect(pin.textContent?.trim()).toBe('●');
      expect(pin.getAttribute('aria-label')).toBe(PIN_ON_LABEL);
      expect(pin.getAttribute('title')).toBe(PIN_ON_LABEL);
    });

    it('emits pinToggled exactly once per click', async () => {
      const { fixture, host } = await mount();
      const pin = at(titlebarButtons(host), 0);

      const calls: void[] = [];
      fixture.componentInstance.pinToggled.subscribe(() =>
        calls.push(undefined),
      );

      pin.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await fixture.whenStable();
      expect(calls).toHaveLength(1);

      pin.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await fixture.whenStable();
      expect(calls).toHaveLength(2);
    });
  });

  describe('collapse button and dblclick', () => {
    it('starts expanded, toggles on click, and hides projected content while collapsed', async () => {
      TestBed.configureTestingModule({
        imports: [HostWindowSlots],
        providers: [provideTexts()],
      });
      const fixture = TestBed.createComponent(HostWindowSlots);
      await fixture.whenStable();
      const host = fixture.nativeElement as HTMLElement;
      const section = host.querySelector('.window') as HTMLElement;
      const collapse = at(titlebarButtons(host), 1);

      expect(collapse.getAttribute('aria-expanded')).toBe('true');
      expect(collapse.textContent?.trim()).toBe('–');
      expect(collapse.getAttribute('aria-label')).toBe(COLLAPSE_OFF_LABEL);
      expect(section.textContent).toContain('TOOLBAR-MARK');
      expect(section.textContent).toContain('DEFAULT-MARK');
      expect(section.textContent).toContain('BODY-MARK');
      expect(section.textContent).toContain('FOOTER-MARK');
      expect(section.querySelector('.body')).not.toBeNull();

      collapse.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await fixture.whenStable();

      expect(collapse.getAttribute('aria-expanded')).toBe('false');
      expect(collapse.textContent?.trim()).toBe('+');
      expect(collapse.getAttribute('aria-label')).toBe(COLLAPSE_ON_LABEL);
      expect(collapse.getAttribute('title')).toBe(COLLAPSE_ON_LABEL);
      expect(section.textContent).not.toContain('TOOLBAR-MARK');
      expect(section.textContent).not.toContain('DEFAULT-MARK');
      expect(section.textContent).not.toContain('BODY-MARK');
      expect(section.textContent).not.toContain('FOOTER-MARK');
      expect(section.querySelector('.body')).toBeNull();
      expect(section.style.maxHeight).toBe('');

      collapse.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await fixture.whenStable();

      expect(collapse.getAttribute('aria-expanded')).toBe('true');
      expect(collapse.textContent?.trim()).toBe('–');
      expect(section.textContent).toContain('BODY-MARK');
    });

    it('toggles on a titlebar dblclick, but not when the double click lands on a button', async () => {
      const { fixture, host } = await mount();
      const titlebar = host.querySelector('.titlebar') as HTMLElement;
      const collapse = at(titlebarButtons(host), 1);

      collapse.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      await fixture.whenStable();

      expect(collapse.getAttribute('aria-expanded')).toBe('true');

      titlebar.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      await fixture.whenStable();

      expect(collapse.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('close button', () => {
    it('is present by default, emits closed, and disappears when closable is false', async () => {
      const { fixture, host } = await mount();

      expect(titlebarButtons(host)).toHaveLength(3);
      const close = at(titlebarButtons(host), 2);
      expect(close.getAttribute('aria-label')).toBe(CLOSE_LABEL);
      expect(close.getAttribute('title')).toBe(CLOSE_LABEL);
      expect(close.textContent?.trim()).toBe('✕');

      const calls: void[] = [];
      fixture.componentInstance.closed.subscribe(() => calls.push(undefined));
      close.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await fixture.whenStable();
      expect(calls).toHaveLength(1);

      fixture.componentRef.setInput('closable', false);
      await fixture.whenStable();

      const remaining = titlebarButtons(host);
      expect(remaining).toHaveLength(2);
      expect(
        remaining.some(
          (button) => button.getAttribute('aria-label') === CLOSE_LABEL,
        ),
      ).toBe(false);
    });
  });

  it('renders the three controls as real, named buttons', async () => {
    const { host } = await mount();
    const buttons = titlebarButtons(host);

    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('type')).toBe('button');
      expect(button.getAttribute('aria-label')).toBeTruthy();
    }
  });

  it('projects toolbar, default, body and footer content, in that order, below the title bar', async () => {
    TestBed.configureTestingModule({
      imports: [HostWindowSlots],
      providers: [provideTexts()],
    });
    const fixture = TestBed.createComponent(HostWindowSlots);
    await fixture.whenStable();
    const section = (fixture.nativeElement as HTMLElement).querySelector(
      '.window',
    ) as HTMLElement;
    const text = section.textContent ?? '';

    const toolbarAt = text.indexOf('TOOLBAR-MARK');
    const defaultAt = text.indexOf('DEFAULT-MARK');
    const bodyAt = text.indexOf('BODY-MARK');
    const footerAt = text.indexOf('FOOTER-MARK');

    expect(toolbarAt).toBeGreaterThanOrEqual(0);
    expect(defaultAt).toBeGreaterThan(toolbarAt);
    expect(bodyAt).toBeGreaterThan(defaultAt);
    expect(footerAt).toBeGreaterThan(bodyAt);

    const bodyWrapper = section.querySelector('.body');
    expect(bodyWrapper?.textContent).toContain('BODY-MARK');
  });

  describe('size (max-height)', () => {
    it('applies the size cap when there is plenty of room, for each size', async () => {
      const { fixture, section } = await mount();
      const restore = stubRect(section, {
        top: 0,
        left: 0,
        width: 400,
        height: 100,
      });
      const restoreViewport = stubViewport(1200, 2000);
      restorers.push(restore, restoreViewport);

      fixture.componentRef.setInput('margin', 0);
      window.dispatchEvent(new Event('resize'));
      await fixture.whenStable();

      for (const size of Object.keys(CAPS) as WindowSize[]) {
        fixture.componentRef.setInput('size', size);
        await fixture.whenStable();

        expect(section.style.maxHeight).toBe(`${CAPS[size]}px`);
      }
    });

    it('shrinks below the cap when the viewport is tight, anchored top', async () => {
      const { fixture, section } = await mount();
      const restore = stubRect(section, {
        top: 750,
        left: 0,
        width: 400,
        height: 50,
      });
      const restoreViewport = stubViewport(1200, 800);
      restorers.push(restore, restoreViewport);

      fixture.componentRef.setInput('size', 'm');
      fixture.componentRef.setInput('margin', 26);
      window.dispatchEvent(new Event('resize'));
      await fixture.whenStable();

      // available = max(200, 800 - 750 - 26) = max(200, 24) = 200
      expect(section.style.maxHeight).toBe('200px');
    });

    it('recomputes on window resize', async () => {
      const { fixture, section } = await mount();
      const restore = stubRect(section, {
        top: 100,
        left: 0,
        width: 400,
        height: 50,
      });
      let restoreViewport = stubViewport(1200, 800);
      restorers.push(restore, restoreViewport);

      fixture.componentRef.setInput('size', 'm');
      fixture.componentRef.setInput('margin', 26);
      window.dispatchEvent(new Event('resize'));
      await fixture.whenStable();

      // available = max(200, 800 - 100 - 26) = 674 -> capped at 470 (size m)
      expect(section.style.maxHeight).toBe('470px');

      restoreViewport();
      restoreViewport = stubViewport(1200, 300);
      restorers[restorers.length - 1] = restoreViewport;
      window.dispatchEvent(new Event('resize'));
      await fixture.whenStable();

      // available = max(200, 300 - 100 - 26) = max(200, 174) = 200
      expect(section.style.maxHeight).toBe('200px');
    });

    it('computes the anchor-bottom formula from the rect bottom edge', async () => {
      const { fixture, section } = await mount();
      const restore = stubRect(section, {
        top: 0,
        left: 0,
        width: 400,
        height: 500,
      });
      const restoreViewport = stubViewport(1200, 1000);
      restorers.push(restore, restoreViewport);

      fixture.componentRef.setInput('anchor', 'bottom');
      fixture.componentRef.setInput('size', 'm');
      fixture.componentRef.setInput('margin', 26);
      window.dispatchEvent(new Event('resize'));
      await fixture.whenStable();

      // rect.bottom = 500; available = max(200, 500 - 26) = 474 -> capped at 470
      expect(section.style.maxHeight).toBe('470px');
    });

    /** Under the cap, so the bottom edge alone decides: the viewport plays no part. */
    it('sizes a bottom-anchored window from its bottom edge when room is tight', async () => {
      const { fixture, section } = await mount();
      restorers.push(
        stubRect(section, { top: 0, left: 0, width: 400, height: 400 }),
        stubViewport(1200, 1000),
      );

      fixture.componentRef.setInput('anchor', 'bottom');
      fixture.componentRef.setInput('margin', 88);
      window.dispatchEvent(new Event('resize'));
      await fixture.whenStable();

      // rect.bottom = 400; available = max(200, 400 - 88) = 312, under the m cap
      expect(section.style.maxHeight).toBe('312px');
    });

    it('stops listening to resize once destroyed', async () => {
      const { fixture, section } = await mount();
      restorers.push(
        stubRect(section, { top: 100, left: 0, width: 400, height: 50 }),
        stubViewport(1200, 800),
      );
      window.dispatchEvent(new Event('resize'));
      const before = section.style.maxHeight;

      fixture.destroy();
      restorers.push(stubViewport(1200, 300));
      window.dispatchEvent(new Event('resize'));

      expect(section.style.maxHeight).toBe(before);
    });

    it('recomputes when expanding after a collapse, against the current viewport', async () => {
      const { fixture, section, host } = await mount();
      const restore = stubRect(section, {
        top: 100,
        left: 0,
        width: 400,
        height: 50,
      });
      let restoreViewport = stubViewport(1200, 800);
      restorers.push(restore, restoreViewport);

      fixture.componentRef.setInput('size', 'm');
      fixture.componentRef.setInput('margin', 26);
      window.dispatchEvent(new Event('resize'));
      await fixture.whenStable();
      expect(section.style.maxHeight).toBe('470px');

      const collapse = at(titlebarButtons(host), 1);
      collapse.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await fixture.whenStable();
      expect(section.style.maxHeight).toBe('');

      restoreViewport();
      restoreViewport = stubViewport(1200, 300);
      restorers[restorers.length - 1] = restoreViewport;

      collapse.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await fixture.whenStable();

      // available = max(200, 300 - 100 - 26) = 200, recomputed fresh on expand
      expect(section.style.maxHeight).toBe('200px');
    });
  });

  describe('drag', () => {
    const rect = { top: 300, left: 500, width: 200, height: 150 };
    // dx bounds: [16 - l0 - width + 150, vw - 150 - l0] = [16-500-200+150, 1200-150-500] = [-534, 550]
    // dy bounds: [12 - t0, vh - 60 - t0] = [12-300, 800-60-300] = [-288, 440]

    const setup = async () => {
      const { fixture, host, section } = await mount();
      const restore = stubRect(section, rect);
      const restoreViewport = stubViewport(1200, 800);
      restorers.push(restore, restoreViewport);
      const titlebar = host.querySelector('.titlebar') as HTMLElement;

      return { fixture, section, titlebar, host };
    };

    it('applies an in-bounds move exactly', async () => {
      const { titlebar, section } = await setup();

      titlebar.dispatchEvent(
        pointerEvent('pointerdown', { clientX: 600, clientY: 400, button: 0 }),
      );
      window.dispatchEvent(
        pointerEvent('pointermove', { clientX: 650, clientY: 430 }),
      );

      expect(section.style.transform).toBe('translate(50px,30px)');

      window.dispatchEvent(
        pointerEvent('pointerup', { clientX: 650, clientY: 430 }),
      );
    });

    it('clamps a move far beyond the left bound', async () => {
      const { titlebar, section } = await setup();

      titlebar.dispatchEvent(
        pointerEvent('pointerdown', { clientX: 600, clientY: 400, button: 0 }),
      );
      window.dispatchEvent(
        pointerEvent('pointermove', { clientX: 600 - 2000, clientY: 400 }),
      );

      expect(section.style.transform).toBe('translate(-534px,0px)');
    });

    it('clamps a move far beyond the right bound', async () => {
      const { titlebar, section } = await setup();

      titlebar.dispatchEvent(
        pointerEvent('pointerdown', { clientX: 600, clientY: 400, button: 0 }),
      );
      window.dispatchEvent(
        pointerEvent('pointermove', { clientX: 600 + 2000, clientY: 400 }),
      );

      expect(section.style.transform).toBe('translate(550px,0px)');
    });

    it('clamps a move far beyond the top bound', async () => {
      const { titlebar, section } = await setup();

      titlebar.dispatchEvent(
        pointerEvent('pointerdown', { clientX: 600, clientY: 400, button: 0 }),
      );
      window.dispatchEvent(
        pointerEvent('pointermove', { clientX: 600, clientY: 400 - 2000 }),
      );

      expect(section.style.transform).toBe('translate(0px,-288px)');
    });

    it('clamps a move far beyond the bottom bound', async () => {
      const { titlebar, section } = await setup();

      titlebar.dispatchEvent(
        pointerEvent('pointerdown', { clientX: 600, clientY: 400, button: 0 }),
      );
      window.dispatchEvent(
        pointerEvent('pointermove', { clientX: 600, clientY: 400 + 2000 }),
      );

      expect(section.style.transform).toBe('translate(0px,440px)');
    });

    it('does not start a drag from a button, so transform stays untouched', async () => {
      const { host, section } = await setup();

      for (const button of titlebarButtons(host)) {
        section.style.transform = '';
        button.dispatchEvent(
          pointerEvent('pointerdown', {
            clientX: 600,
            clientY: 400,
            button: 0,
          }),
        );
        window.dispatchEvent(
          pointerEvent('pointermove', { clientX: 900, clientY: 700 }),
        );

        expect(section.style.transform).toBe('');

        window.dispatchEvent(
          pointerEvent('pointerup', { clientX: 900, clientY: 700 }),
        );
      }
    });

    it('ignores a non-primary pointer button', async () => {
      const { titlebar, section } = await setup();

      titlebar.dispatchEvent(
        pointerEvent('pointerdown', { clientX: 600, clientY: 400, button: 2 }),
      );
      window.dispatchEvent(
        pointerEvent('pointermove', { clientX: 900, clientY: 700 }),
      );

      expect(section.style.transform).toBe('');
    });

    it('stops applying moves after pointerup', async () => {
      const { titlebar, section } = await setup();

      titlebar.dispatchEvent(
        pointerEvent('pointerdown', { clientX: 600, clientY: 400, button: 0 }),
      );
      window.dispatchEvent(
        pointerEvent('pointermove', { clientX: 650, clientY: 430 }),
      );
      expect(section.style.transform).toBe('translate(50px,30px)');

      window.dispatchEvent(
        pointerEvent('pointerup', { clientX: 650, clientY: 430 }),
      );
      window.dispatchEvent(
        pointerEvent('pointermove', { clientX: 900, clientY: 700 }),
      );

      expect(section.style.transform).toBe('translate(50px,30px)');
    });

    it('stops applying moves after pointercancel', async () => {
      const { titlebar, section } = await setup();

      titlebar.dispatchEvent(
        pointerEvent('pointerdown', { clientX: 600, clientY: 400, button: 0 }),
      );
      window.dispatchEvent(
        pointerEvent('pointermove', { clientX: 650, clientY: 430 }),
      );
      expect(section.style.transform).toBe('translate(50px,30px)');

      window.dispatchEvent(
        pointerEvent('pointercancel', { clientX: 650, clientY: 430 }),
      );
      window.dispatchEvent(
        pointerEvent('pointermove', { clientX: 900, clientY: 700 }),
      );

      expect(section.style.transform).toBe('translate(50px,30px)');
    });

    it('never re-renders projected content while the pointer is moving', async () => {
      TestBed.configureTestingModule({
        imports: [HostWindowRenderCount],
        providers: [provideTexts()],
      });
      const fixture = TestBed.createComponent(HostWindowRenderCount);
      const host = fixture.nativeElement as HTMLElement;
      const section = host.querySelector('.window') as HTMLElement;
      const restore = stubRect(section, rect);
      const restoreViewport = stubViewport(1200, 800);
      restorers.push(restore, restoreViewport);
      await fixture.whenStable();

      const countAfter = () =>
        Number(host.querySelector('[body]')?.textContent?.trim());
      const titlebar = host.querySelector('.titlebar') as HTMLElement;

      // Starting a drag may itself trigger one settle render (e.g. a
      // "dragging" state read by the template). The truth under test is
      // narrower and stronger: once the drag is under way, no amount of
      // pointer motion re-renders anything, so the baseline is taken right
      // after the drag starts, not before.
      titlebar.dispatchEvent(
        pointerEvent('pointerdown', { clientX: 600, clientY: 400, button: 0 }),
      );
      await fixture.whenStable();
      const before = countAfter();

      window.dispatchEvent(
        pointerEvent('pointermove', { clientX: 610, clientY: 405 }),
      );
      window.dispatchEvent(
        pointerEvent('pointermove', { clientX: 620, clientY: 410 }),
      );
      window.dispatchEvent(
        pointerEvent('pointermove', { clientX: 630, clientY: 415 }),
      );
      await fixture.whenStable();
      window.dispatchEvent(
        pointerEvent('pointerup', { clientX: 630, clientY: 415 }),
      );
      await fixture.whenStable();

      expect(countAfter()).toBe(before);
    });

    it('removes its window listeners on destroy: a later pointermove throws nothing and changes nothing', async () => {
      const { fixture, titlebar, section } = await setup();

      titlebar.dispatchEvent(
        pointerEvent('pointerdown', { clientX: 600, clientY: 400, button: 0 }),
      );
      window.dispatchEvent(
        pointerEvent('pointermove', { clientX: 650, clientY: 430 }),
      );
      const transformBeforeDestroy = section.style.transform;
      expect(transformBeforeDestroy).toBe('translate(50px,30px)');

      fixture.destroy();

      expect(() => {
        window.dispatchEvent(
          pointerEvent('pointermove', { clientX: 900, clientY: 700 }),
        );
      }).not.toThrow();
      expect(section.style.transform).toBe(transformBeforeDestroy);
    });
  });
  describe('body scroll', () => {
    it('reads and sets where the body is scrolled, 0 and inert while collapsed', async () => {
      const { fixture, host } = await mount();
      const body = host.querySelector<HTMLElement>('.body');
      if (!body) {
        throw new Error('expected a body');
      }

      fixture.componentInstance.scrollBodyTo(120);
      expect(body.scrollTop).toBe(120);
      expect(fixture.componentInstance.bodyScrollTop()).toBe(120);

      host
        .querySelector<HTMLButtonElement>(
          `[aria-label="${COLLAPSE_OFF_LABEL}"]`,
        )
        ?.click();
      await fixture.whenStable();

      expect(fixture.componentInstance.bodyScrollTop()).toBe(0);
      expect(() => {
        fixture.componentInstance.scrollBodyTo(40);
      }).not.toThrow();
    });
  });
});
