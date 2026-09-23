import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WindowComponent } from './window.component';
import { WindowSize } from '../../models/window.model';
import { ScrollMemoryService } from '../../services/scroll-memory.service';
import { provideTexts } from '@testing/fixtures/texts.fixture';

const PIN_OFF_LABEL =
  'Épingler : garder la fenêtre ouverte en changeant de page';
const PIN_ON_LABEL = 'Détacher : la fenêtre se refermera en changeant de page';
const COLLAPSE_OFF_LABEL = 'Replier la fenêtre';
const COLLAPSE_ON_LABEL = 'Déplier la fenêtre';
const CLOSE_LABEL = 'Fermer la fenêtre';

const CAPS: Record<WindowSize, number> = { s: 300, m: 470, l: 920 };

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
  selector: 'app-host-window-zones',
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
class HostWindowZones {}

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

const bodyOf = (host: HTMLElement): HTMLElement => {
  const found = host.querySelector<HTMLElement>('.body');
  if (!found) {
    throw new Error('expected a body');
  }
  return found;
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
        imports: [HostWindowZones],
        providers: [provideTexts()],
      });
      const fixture = TestBed.createComponent(HostWindowZones);
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
      imports: [HostWindowZones],
      providers: [provideTexts()],
    });
    const fixture = TestBed.createComponent(HostWindowZones);
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

  describe('height', () => {
    it('bounds the section to the ceiling of its size, and lets it go while folded', async () => {
      const { fixture, host, section } = await mount();
      restorers.push(stubViewport(1200, 2000));

      for (const size of Object.keys(CAPS) as WindowSize[]) {
        fixture.componentRef.setInput('size', size);
        await fixture.whenStable();

        expect(section.style.maxHeight).toBe(`${String(CAPS[size])}px`);
      }

      at(titlebarButtons(host), 1).click();
      await fixture.whenStable();
      expect(section.style.maxHeight).toBe('');

      at(titlebarButtons(host), 1).click();
      await fixture.whenStable();
      expect(section.style.maxHeight).toBe(`${String(CAPS.l)}px`);
    });

    it('measures the room from its bottom edge when anchored at the bottom', async () => {
      const { fixture, section } = await mount();
      restorers.push(stubViewport(1200, 2000));
      Object.defineProperty(section, 'offsetHeight', {
        value: 300,
        configurable: true,
      });
      restorers.push(() => Reflect.deleteProperty(section, 'offsetHeight'));

      fixture.componentRef.setInput('anchor', 'bottom');
      await fixture.whenStable();

      expect(section.style.maxHeight).toBe('300px');
    });
  });

  describe('drag', () => {
    it('moves by its title bar, never by one of its buttons', async () => {
      const { host, section } = await mount();
      restorers.push(stubViewport(1200, 800));
      section.getBoundingClientRect = () => new DOMRect(500, 300, 200, 150);
      const titlebar = host.querySelector('.titlebar') as HTMLElement;

      at(titlebarButtons(host), 0).dispatchEvent(
        pointerEvent('pointerdown', { clientX: 0, clientY: 0, button: 0 }),
      );
      window.dispatchEvent(
        pointerEvent('pointermove', { clientX: 50, clientY: 30 }),
      );
      expect(section.style.transform).toBe('');

      titlebar.dispatchEvent(
        pointerEvent('pointerdown', { clientX: 0, clientY: 0, button: 0 }),
      );
      window.dispatchEvent(
        pointerEvent('pointermove', { clientX: 50, clientY: 30 }),
      );
      window.dispatchEvent(
        pointerEvent('pointerup', { clientX: 50, clientY: 30 }),
      );
      expect(section.style.transform).toBe('translate(50px,30px)');
    });
  });

  describe('body scroll', () => {
    it('puts the body back where it was left under its scroll key', async () => {
      const { fixture, host } = await mount();
      TestBed.inject(ScrollMemoryService).save('index', 120);

      fixture.componentRef.setInput('scrollKey', 'index');
      await fixture.whenStable();

      expect(bodyOf(host).scrollTop).toBe(120);
    });

    it('takes the body back to the top when scrollResetOn changes', async () => {
      const { fixture, host } = await mount();
      fixture.componentRef.setInput('scrollResetOn', 0);
      await fixture.whenStable();
      bodyOf(host).scrollTop = 80;

      fixture.componentRef.setInput('scrollResetOn', 1);
      await fixture.whenStable();

      expect(bodyOf(host).scrollTop).toBe(0);
    });
  });
});
