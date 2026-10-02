import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  WINDOW_FOLD,
  WINDOW_TEXTS,
  WindowFold,
  WindowTexts,
} from '../../ports';
import { loadWindowMenu, WindowComponent } from './window.component';
import { ScrollMemoryService } from '../../services/scroll-memory.service';
import { tap as tapOn } from '@testing/fixtures/pointer.fixture';
import { at, recordOutput } from '@testing/fixtures/testbed.fixture';
import { provideTexts } from '@testing/fixtures/texts.fixture';

const texts = (): WindowTexts => TestBed.inject(WINDOW_TEXTS)();

type Control = 'collapse' | 'close';

const namesOf = (name: Control): readonly string[] => {
  const { close, phone } = texts();
  return {
    collapse: [phone.fold, phone.unfold],
    close: [close],
  }[name];
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
  ...host.querySelectorAll<HTMLButtonElement>('.grip, .titlebar button'),
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

const tap = (on: Element, at = 0): void => {
  tapOn(on, { x: 100, y: 10, at }, { at: at + 50 });
};

const menuOpener = (host: HTMLElement): HTMLButtonElement =>
  host.querySelector('.titlebar button.menu-opener') as HTMLButtonElement;

const openMenu = async (
  fixture: ComponentFixture<unknown>,
  host: HTMLElement,
): Promise<void> => {
  await loadWindowMenu();
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
  menuOpener(host).click();
  await fixture.whenStable();
};

const menuItem = (host: HTMLElement, label: string): HTMLButtonElement => {
  const found = [
    ...host.querySelectorAll<HTMLButtonElement>('[role="menu"] button'),
  ].find((button) => button.textContent?.trim() === label);
  if (!found) {
    throw new Error(`expected the menu item « ${label} »`);
  }
  return found;
};

class FoldDouble implements WindowFold {
  public readonly active = signal(true);
  public readonly folded = signal(false);
  public readonly handles: HTMLElement[] = [];
  public toggles = 0;

  public readonly isActive = (): boolean => this.active();
  public readonly isFolded = (): boolean => this.folded();
  public readonly toggle = (): void => {
    this.toggles += 1;
  };
  public readonly hold = (handle: HTMLElement): (() => void) => {
    this.handles.push(handle);
    return () => {
      this.handles.splice(this.handles.indexOf(handle), 1);
    };
  };
}

const mountHeld = async () => {
  const fold = new FoldDouble();
  TestBed.configureTestingModule({
    imports: [HostWindowZones],
    providers: [provideTexts(), { provide: WINDOW_FOLD, useValue: fold }],
  });
  const fixture = TestBed.createComponent(HostWindowZones);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  return { fixture, host, fold, collapse: control(host, 'collapse') };
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

  it('orders the title bar: the window menu, title, meta, then the other buttons', async () => {
    const { fixture, host } = await mount();
    fixture.componentRef.setInput('meta', '3 éléments');
    await fixture.whenStable();

    const titlebar = host.querySelector('.titlebar') as HTMLElement;
    const children = [...titlebar.children];
    const menuIndex = children.findIndex((el) =>
      el.classList.contains('menu-opener'),
    );
    const h2Index = children.findIndex((el) => el.tagName === 'H2');
    const metaIndex = children.findIndex((el) => el.classList.contains('meta'));
    const controlsIndex = children.findIndex(
      (el) => el.tagName.toLowerCase() === 'app-window-controls',
    );

    expect(menuIndex).toBe(0);
    expect(menuOpener(host).getAttribute('aria-label')).toBe(texts().menu);
    expect(h2Index).toBeGreaterThan(menuIndex);
    expect(at(children, h2Index).textContent?.trim()).toBe('Console');
    expect(metaIndex).toBeGreaterThan(h2Index);
    expect(at(children, metaIndex).textContent?.trim()).toBe('3 éléments');
    expect(controlsIndex).toBeGreaterThan(metaIndex);
    for (const button of titlebarButtons(host)) {
      expect(button.getAttribute('type')).toBe('button');
    }
  });

  describe('kept mark', () => {
    it('shows a mark next to the title and says it in the window name once pinned', async () => {
      const { fixture, host, section } = await mount();

      expect(host.querySelector('.titlebar .kept')).toBeNull();
      expect(section.getAttribute('aria-label')).toBe('Console');

      fixture.componentRef.setInput('pinned', true);
      await fixture.whenStable();

      expect(host.querySelector('.titlebar .kept')).not.toBeNull();
      expect(section.getAttribute('aria-label')).toBe(
        `Console, ${texts().keptOpen}`,
      );

      fixture.componentRef.setInput('pinned', false);
      await fixture.whenStable();

      expect(host.querySelector('.titlebar .kept')).toBeNull();
      expect(section.getAttribute('aria-label')).toBe('Console');
    });
  });

  describe('window menu', () => {
    it('shows a chevron next to the square, and keeps the same name and tip', async () => {
      const { host } = await mount();

      const opener = menuOpener(host);
      expect(opener.querySelector('svg.chevron')).not.toBeNull();
      expect(opener.getAttribute('aria-label')).toBe(texts().menu);
      expect(opener.querySelector('.tip')?.textContent).toBe(texts().menu);
    });

    it('keeps the pin checked state in step with the pinned input, and emits once per press', async () => {
      const { fixture, host } = await mount();
      const calls = recordOutput(fixture.componentInstance.pinToggled);
      await openMenu(fixture, host);

      const pin = menuItem(host, texts().keepOpen);
      expect(pin.getAttribute('aria-checked')).toBe('false');

      pin.click();
      fixture.componentRef.setInput('pinned', true);
      await fixture.whenStable();
      await openMenu(fixture, host);

      expect(calls).toHaveLength(1);
      expect(
        menuItem(host, texts().keepOpen).getAttribute('aria-checked'),
      ).toBe('true');
    });
  });

  describe('content', () => {
    it('projects toolbar, default, body and footer content in that order below the title bar', async () => {
      TestBed.configureTestingModule({
        imports: [HostWindowZones],
        providers: [provideTexts()],
      });
      const fixture = TestBed.createComponent(HostWindowZones);
      await fixture.whenStable();
      const section = (fixture.nativeElement as HTMLElement).querySelector(
        '.window',
      ) as HTMLElement;

      expect(section.textContent ?? '').toMatch(
        /Console.*TOOLBAR-MARK.*DEFAULT-MARK.*BODY-MARK.*FOOTER-MARK/s,
      );
      expect(section.querySelector('.body')?.textContent).toContain(
        'BODY-MARK',
      );
    });

    it('has no fold beyond the phone, and keeps its content on a double click', async () => {
      const { fixture, host } = await mount();

      host
        .querySelector('.titlebar')
        ?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      await fixture.whenStable();

      expect(() => control(host, 'collapse')).toThrow();
      expect(host.querySelector('.body')).not.toBeNull();
    });
  });

  describe('close button', () => {
    it('is present by default, emits closed, and disappears when closable is false', async () => {
      const { fixture, host } = await mount();

      expect(titlebarButtons(host)).toHaveLength(2);
      const close = control(host, 'close');
      expect(close.getAttribute('aria-label')).toBe(texts().close);

      const calls = recordOutput(fixture.componentInstance.closed);
      close.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await fixture.whenStable();
      expect(calls).toHaveLength(1);

      fixture.componentRef.setInput('closable', false);
      await fixture.whenStable();

      const remaining = titlebarButtons(host);
      expect(remaining).toHaveLength(1);
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

  describe('held by a fold port', () => {
    it('hands its title bar to the port as the handle, and takes it back when destroyed', async () => {
      const { fixture, host, fold } = await mountHeld();

      expect(fold.handles).toEqual([host.querySelector('.titlebar')]);

      fixture.destroy();

      expect(fold.handles).toEqual([]);
    });

    it('asks the port to fold from its grip, a double click and a double tap of its title bar, and keeps its content', async () => {
      const { fixture, host, fold, collapse } = await mountHeld();
      const heading = host.querySelector('.titlebar h2') as HTMLElement;

      collapse.click();
      host
        .querySelector('.titlebar')
        ?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      tap(heading, 1000);
      tap(heading, 1150);
      await fixture.whenStable();

      expect(fold.toggles).toBe(3);
      expect(host.querySelector('.body')?.textContent).toContain('BODY-MARK');
    });

    it('says folded when the port does, and takes what lies under its bar out of reach', async () => {
      const { fixture, host, fold, collapse } = await mountHeld();

      fold.folded.set(true);
      await fixture.whenStable();

      expect(collapse.getAttribute('aria-expanded')).toBe('false');
      expect(collapse.getAttribute('aria-label')).toBe(texts().phone.unfold);
      expect(host.querySelector('.below')?.hasAttribute('inert')).toBe(true);
      expect(host.querySelector('.body')?.textContent).toContain('BODY-MARK');

      fold.folded.set(false);
      await fixture.whenStable();

      expect(host.querySelector('.below')?.hasAttribute('inert')).toBe(false);
    });

    it('offers no fold while the port is not in charge', async () => {
      const fold = new FoldDouble();
      fold.active.set(false);
      TestBed.configureTestingModule({
        imports: [HostWindowZones],
        providers: [provideTexts(), { provide: WINDOW_FOLD, useValue: fold }],
      });
      const fixture = TestBed.createComponent(HostWindowZones);
      await fixture.whenStable();
      const host = fixture.nativeElement as HTMLElement;

      host
        .querySelector('.titlebar')
        ?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      await fixture.whenStable();

      expect(() => control(host, 'collapse')).toThrow();
      expect(fold.toggles).toBe(0);
    });
  });
});
