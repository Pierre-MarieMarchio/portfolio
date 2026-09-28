import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WINDOW_TEXTS, WindowTexts } from '../../ports';
import { WindowComponent } from './window.component';
import { loadGlassGestures } from '../../directives/glass-gesture.directive';
import { WindowSize } from '../../models/window.model';
import { ScrollMemoryService } from '../../services/scroll-memory.service';
import { stubViewport } from '@testing/doubles/browser.double';
import {
  drag as dragAlong,
  pointer,
  tap as tapOn,
} from '@testing/fixtures/pointer.fixture';
import { at, recordOutput } from '@testing/fixtures/testbed.fixture';
import { provideTexts } from '@testing/fixtures/texts.fixture';

const texts = (): WindowTexts => TestBed.inject(WINDOW_TEXTS)();

type Control = 'pin' | 'collapse' | 'close';

const namesOf = (name: Control): readonly string[] => {
  const { pin, unpin, fold, unfold, close, phone } = texts();
  return {
    pin: [pin, unpin, phone.pin, phone.unpin],
    collapse: [fold, unfold, phone.fold, phone.unfold],
    close: [close],
  }[name];
};

const CAPS: Record<WindowSize, number> = { s: 300, m: 470, l: 920 };

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

const control = (host: HTMLElement, name: Control): HTMLButtonElement => {
  const names = namesOf(name);
  const found = titlebarButtons(host).find((button) =>
    names.includes(button.getAttribute('aria-label') ?? ''),
  );
  if (!found) {
    throw new Error(`expected the ${name} button`);
  }
  return found;
};

const drag = (on: Element, dx: number, dy: number): void => {
  dragAlong(
    on,
    [
      { x: 100, y: 100, at: 0 },
      { x: 100 + dx / 2, y: 100 + dy / 2, at: 150 },
      { x: 100 + dx, y: 100 + dy, at: 300 },
    ],
    { x: 100 + dx, y: 100 + dy, at: 310 },
  );
};

const tap = (on: Element, at = 0): void => {
  tapOn(on, { x: 100, y: 10, at }, { at: at + 50 });
};

const mountOnPhone = async () => {
  stubViewport(390, 844);
  const mounted = await mount();
  await loadGlassGestures();
  await mounted.fixture.whenStable();
  const heading = mounted.host.querySelector('.titlebar h2') as HTMLElement;
  const collapse = control(mounted.host, 'collapse');
  return { ...mounted, heading, collapse };
};

describe('WindowComponent', () => {
  const restorers: Array<() => void> = [];

  afterEach(() => {
    while (restorers.length > 0) {
      restorers.pop()?.();
    }
    vi.unstubAllGlobals();
  });

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
      (el) => el.querySelector('button') !== null,
    );

    expect(at(children, 0).getAttribute('aria-hidden')).toBe('true');
    expect(h2Index).toBeGreaterThan(0);
    expect(at(children, h2Index).textContent?.trim()).toBe('Console');
    expect(metaIndex).toBeGreaterThan(h2Index);
    expect(at(children, metaIndex).textContent?.trim()).toBe('3 éléments');
    expect(firstButtonIndex).toBeGreaterThan(metaIndex);
    for (const button of titlebarButtons(host)) {
      expect(button.getAttribute('type')).toBe('button');
    }
  });

  describe('pin button', () => {
    it('starts unpinned, and only the pinned input changes its state and label', async () => {
      const { fixture, host } = await mount();
      const pin = control(host, 'pin');

      expect(pin.getAttribute('aria-pressed')).toBe('false');
      expect(pin.getAttribute('aria-label')).toBe(texts().pin);

      pin.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await fixture.whenStable();

      expect(pin.getAttribute('aria-pressed')).toBe('false');

      fixture.componentRef.setInput('pinned', true);
      await fixture.whenStable();

      expect(pin.getAttribute('aria-pressed')).toBe('true');
      expect(pin.getAttribute('aria-label')).toBe(texts().unpin);
    });

    it('emits pinToggled exactly once per click', async () => {
      const { fixture, host } = await mount();
      const calls = recordOutput(fixture.componentInstance.pinToggled);

      control(host, 'pin').dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
      await fixture.whenStable();

      expect(calls).toHaveLength(1);
    });
  });

  describe('collapse button and dblclick', () => {
    it('projects toolbar, default, body and footer content in that order below the title bar, starts expanded, and hides it while collapsed', async () => {
      TestBed.configureTestingModule({
        imports: [HostWindowZones],
        providers: [provideTexts()],
      });
      const fixture = TestBed.createComponent(HostWindowZones);
      await fixture.whenStable();
      const host = fixture.nativeElement as HTMLElement;
      const section = host.querySelector('.window') as HTMLElement;
      const collapse = control(host, 'collapse');
      const text = section.textContent ?? '';
      const marks = [
        'TOOLBAR-MARK',
        'DEFAULT-MARK',
        'BODY-MARK',
        'FOOTER-MARK',
      ];

      expect(collapse.getAttribute('aria-expanded')).toBe('true');
      expect(collapse.getAttribute('aria-label')).toBe(texts().fold);
      expect(text).toMatch(
        /Console.*TOOLBAR-MARK.*DEFAULT-MARK.*BODY-MARK.*FOOTER-MARK/s,
      );
      expect(section.querySelector('.body')?.textContent).toContain(
        'BODY-MARK',
      );

      collapse.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await fixture.whenStable();

      expect(collapse.getAttribute('aria-expanded')).toBe('false');
      expect(collapse.getAttribute('aria-label')).toBe(texts().unfold);
      for (const mark of marks) {
        expect(section.textContent).not.toContain(mark);
      }
      expect(section.querySelector('.body')).toBeNull();
      expect(section.style.maxHeight).toBe('');

      collapse.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await fixture.whenStable();

      expect(collapse.getAttribute('aria-expanded')).toBe('true');
      expect(section.textContent).toContain('BODY-MARK');
    });

    it('toggles on a titlebar dblclick', async () => {
      const { fixture, host } = await mount();
      const titlebar = host.querySelector('.titlebar') as HTMLElement;

      titlebar.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      await fixture.whenStable();

      expect(control(host, 'collapse').getAttribute('aria-expanded')).toBe(
        'false',
      );
    });

    it('toggles on a double tap of the titlebar', async () => {
      const { fixture, host } = await mount();
      const heading = host.querySelector('.titlebar h2') as HTMLElement;

      tap(heading, 0);
      tap(heading, 150);
      await fixture.whenStable();

      expect(control(host, 'collapse').getAttribute('aria-expanded')).toBe(
        'false',
      );
    });
  });

  describe('close button', () => {
    it('is present by default, emits closed, and disappears when closable is false', async () => {
      const { fixture, host } = await mount();

      expect(titlebarButtons(host)).toHaveLength(3);
      const close = control(host, 'close');
      expect(close.getAttribute('aria-label')).toBe(texts().close);

      const calls = recordOutput(fixture.componentInstance.closed);
      close.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await fixture.whenStable();
      expect(calls).toHaveLength(1);

      fixture.componentRef.setInput('closable', false);
      await fixture.whenStable();

      const remaining = titlebarButtons(host);
      expect(remaining).toHaveLength(2);
      expect(
        remaining.some(
          (button) => button.getAttribute('aria-label') === texts().close,
        ),
      ).toBe(false);
    });
    it('names the close button after where the caller says it leads', async () => {
      const { fixture, host } = await mount();

      fixture.componentRef.setInput(
        'closeLabel',
        'Fermer et revenir à l’accueil',
      );
      await fixture.whenStable();

      expect(
        titlebarButtons(host).some(
          (button) =>
            button.getAttribute('aria-label') ===
            'Fermer et revenir à l’accueil',
        ),
      ).toBe(true);
    });
  });

  describe('height', () => {
    it('bounds the section to the ceiling of its size, and lets it go while folded', async () => {
      const { fixture, host, section } = await mount();
      stubViewport(1200, 2000);

      for (const size of Object.keys(CAPS) as WindowSize[]) {
        fixture.componentRef.setInput('size', size);
        await fixture.whenStable();

        expect(section.style.maxHeight).toBe(`${String(CAPS[size])}px`);
      }

      control(host, 'collapse').click();
      await fixture.whenStable();
      expect(section.style.maxHeight).toBe('');

      control(host, 'collapse').click();
      await fixture.whenStable();
      expect(section.style.maxHeight).toBe(`${String(CAPS.l)}px`);
    });

    it('measures the room from its bottom edge when anchored at the bottom', async () => {
      const { fixture, section } = await mount();
      stubViewport(1200, 2000);
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
    it('moves by its title bar', async () => {
      const { host, section } = await mount();
      stubViewport(1200, 800);
      section.getBoundingClientRect = () => new DOMRect(500, 300, 200, 150);
      const titlebar = host.querySelector('.titlebar') as HTMLElement;

      titlebar.dispatchEvent(pointer('pointerdown', { x: 0, y: 0 }));
      window.dispatchEvent(pointer('pointermove', { x: 50, y: 30 }));
      window.dispatchEvent(pointer('pointerup', { x: 50, y: 30 }));
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
      bodyOf(host).dispatchEvent(new Event('scroll'));

      fixture.componentRef.setInput('scrollResetOn', 1);
      await fixture.whenStable();

      expect(bodyOf(host).scrollTop).toBe(0);
    });
  });

  describe('at the phone format', () => {
    it('folds when its title bar is pulled down', async () => {
      const { fixture, host, heading, collapse } = await mountOnPhone();

      drag(heading, 0, 80);
      await fixture.whenStable();

      expect(collapse.getAttribute('aria-expanded')).toBe('false');
      expect(host.querySelector('.body')).toBeNull();
    });

    it('unfolds on a lift or a tap of its folded bar', async () => {
      const { fixture, heading, collapse } = await mountOnPhone();
      collapse.click();
      await fixture.whenStable();

      drag(heading, 0, -60);
      await fixture.whenStable();
      const afterLift = collapse.getAttribute('aria-expanded');
      collapse.click();
      await fixture.whenStable();
      tap(heading);
      await fixture.whenStable();

      expect(afterLift).toBe('true');
      expect(collapse.getAttribute('aria-expanded')).toBe('true');
    });

    it('stays open when its folded bar is tapped twice in a row', async () => {
      const { fixture, heading, collapse } = await mountOnPhone();
      collapse.click();
      await fixture.whenStable();

      tap(heading);
      await fixture.whenStable();
      tap(heading);
      await fixture.whenStable();

      expect(collapse.getAttribute('aria-expanded')).toBe('true');
    });
  });
});
