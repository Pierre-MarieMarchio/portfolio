import { TestBed } from '@angular/core/testing';
import { ObjectRegistry } from '@shared/ui/object-marks';
import { ObjectComponent } from './object.component';
import { ObjectBody, ObjectView } from './object.model';

const BODIES: readonly ObjectBody[] = [
  { title: 'Skyted Voice', short: 'Skyted Voice' },
  { title: 'Skyted App', short: 'Skyted App' },
  { title: 'ngx-statewise', short: 'ngx-statewise' },
  { title: 'Template Clean Architecture .NET', short: 'Template .NET' },
  { title: 'Bk-ONE', short: 'Bk-ONE' },
];

/**
 * A 2D context that accepts every call and answers itself, so the engine
 * runs in jsdom, which has no canvas. Its drawing is not under test here.
 */
const fakeContext = (): unknown => {
  const target = (): undefined => undefined;
  const proxy: unknown = new Proxy(target, {
    get: () => proxy,
    set: () => true,
    apply: () => proxy,
  });
  return proxy;
};

/** A media query list that never matches and never changes. */
const quietMedia =
  (matches: (query: string) => boolean) => (query: string) => ({
    matches: matches(query),
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  });

describe('ObjectComponent', () => {
  const mount = async (
    options: {
      view?: ObjectView;
      preview?: number;
      hovered?: number;
      context?: boolean;
      touch?: boolean;
      /** Lines of the home rule signed in before the mount, as the rule's are. */
      lines?: number;
    } = {},
  ) => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () =>
        (options.context === false
          ? null
          : fakeContext()) as CanvasRenderingContext2D | null,
    );
    vi.stubGlobal(
      'matchMedia',
      quietMedia((query) => query === '(hover: none)' && !!options.touch),
    );
    TestBed.configureTestingModule({ imports: [ObjectComponent] });
    const registry = TestBed.inject(ObjectRegistry);
    const lines = Array.from({ length: options.lines ?? 0 }, () => {
      const line = document.createElement('button');
      document.body.append(line);
      registry.addLine(line);
      return line;
    });
    const fixture = TestBed.createComponent(ObjectComponent);
    fixture.componentRef.setInput('bodies', BODIES);
    fixture.componentRef.setInput('featured', 4);
    fixture.componentRef.setInput('view', options.view ?? 'home');
    fixture.componentRef.setInput('preview', options.preview ?? -1);
    fixture.componentRef.setInput('hovered', options.hovered ?? -1);
    const clicked: number[] = [];
    const hovered: number[] = [];
    let spins = 0;
    fixture.componentInstance.bodyClicked.subscribe((rank) =>
      clicked.push(rank),
    );
    fixture.componentInstance.bodyHovered.subscribe((rank) =>
      hovered.push(rank),
    );
    fixture.componentInstance.spun.subscribe(() => (spins += 1));
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      host,
      clicked,
      hovered,
      lines,
      spins: () => spins,
      buttons: () =>
        Array.from(
          host.querySelectorAll<HTMLButtonElement>('button[data-object-body]'),
        ),
    };
  };

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('the lines of the home rule', () => {
    const frames = (): Promise<void> =>
      new Promise((resolve) => setTimeout(resolve, 80));

    afterEach(() => {
      document.body.replaceChildren();
    });

    it('keeps them down and out of reach until the rest has arrived', async () => {
      const { lines } = await mount({ lines: 2 });
      await frames();

      lines.forEach((line) => {
        expect(line.style.opacity).toBe('0');
        expect(line.style.transform).toBe('translateY(9.0px)');
        expect(line.style.pointerEvents).toBe('none');
      });
    });

    it('shows them risen away from the home page, where nothing is waited for', async () => {
      const { lines } = await mount({ view: 'index', lines: 2 });
      await frames();

      lines.forEach((line) => {
        expect(line.style.opacity).toBe('1');
        expect(line.style.transform).toBe('none');
        expect(line.style.pointerEvents).toBe('auto');
      });
    });
  });

  it('draws on two canvases hidden from assistive technologies', async () => {
    const { host } = await mount();
    const canvases = Array.from(host.querySelectorAll('canvas'));
    expect(canvases).toHaveLength(2);
    canvases.forEach((canvas) => {
      expect(canvas.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('names a button per body on the home page, as a preview', async () => {
    const { buttons } = await mount();
    expect(buttons().map((button) => button.textContent?.trim())).toEqual([
      'Aperçu du projet Skyted Voice',
      'Aperçu du projet Skyted App',
      'Aperçu du projet ngx-statewise',
      'Aperçu du projet Template Clean Architecture .NET',
      'Aperçu du projet Bk-ONE',
    ]);
  });

  it('names them as index selections on the index, numbered like the REF column', async () => {
    const { buttons, host } = await mount({ view: 'index' });
    expect(buttons()[3]?.textContent?.trim()).toBe(
      'Sélectionner 04 — Template Clean Architecture .NET dans le relevé',
    );
    expect(
      Array.from(host.querySelectorAll('.label')).map((label) =>
        label.textContent?.trim(),
      ),
    ).toEqual(['01', '02', '03', '04', '05']);
    expect(buttons()[0]?.hasAttribute('aria-expanded')).toBe(false);
  });

  it('says which body the preview shows', async () => {
    const { buttons } = await mount({ preview: 1 });
    expect(
      buttons().map((button) => button.getAttribute('aria-expanded')),
    ).toEqual(['false', 'true', 'false', 'false', 'false']);
  });

  it('keeps a body that is not placed yet out of reach', async () => {
    // The home page's planets rise after the crossing: none is drawn yet.
    const { buttons } = await mount();
    buttons().forEach((button) => {
      expect(button.getAttribute('aria-hidden')).toBe('true');
      expect(button.tabIndex).toBe(-1);
      expect(button.style.pointerEvents).not.toBe('auto');
    });
  });

  it('offers no target on the sheet, only labels, and nothing on about', async () => {
    const sheet = await mount({ view: 'sheet' });
    expect(sheet.buttons()).toHaveLength(0);
    expect(sheet.host.querySelectorAll('.label')).toHaveLength(5);
    TestBed.resetTestingModule();

    const about = await mount({ view: 'about' });
    expect(about.buttons()).toHaveLength(0);
    expect(about.host.querySelectorAll('.label')).toHaveLength(0);
  });

  it('emits the rank on a click, and on hover and focus, -1 on leaving', async () => {
    const { buttons, clicked, hovered } = await mount();
    const third = buttons()[2];
    if (!third) {
      throw new Error('expected a third body');
    }
    third.click();
    third.dispatchEvent(new MouseEvent('mouseenter'));
    third.dispatchEvent(new MouseEvent('mouseleave'));
    third.dispatchEvent(new FocusEvent('focus'));
    third.dispatchEvent(new FocusEvent('blur'));

    expect(clicked).toEqual([2]);
    expect(hovered).toEqual([2, -1, 2, -1]);
  });

  it('takes two touches without hover: the first reveals, the second opens', async () => {
    const first = await mount({ touch: true });
    first.buttons()[1]?.click();
    expect(first.clicked).toEqual([]);
    expect(first.hovered).toEqual([1]);
    TestBed.resetTestingModule();

    const second = await mount({ touch: true, hovered: 1 });
    second.buttons()[1]?.click();
    expect(second.clicked).toEqual([1]);
  });

  it('selects at the first touch on the index', async () => {
    const { buttons, clicked } = await mount({ view: 'index', touch: true });
    buttons()[0]?.click();
    expect(clicked).toEqual([0]);
  });

  it('reports a spin after a drag of more than 6 px, not after a click', async () => {
    const { host, spins } = await mount();
    // jsdom has no PointerEvent constructor everywhere: a MouseEvent under
    // the pointer's name carries the same coordinates and button.
    const pointer = (type: string, x: number, y: number): void => {
      const event = new MouseEvent(type, {
        bubbles: true,
        clientX: x,
        clientY: y,
        button: 0,
      });
      host.dispatchEvent(event);
    };

    pointer('pointerdown', 10, 10);
    pointer('pointermove', 12, 11);
    pointer('pointerup', 12, 11);
    expect(spins()).toBe(0);

    pointer('pointerdown', 10, 10);
    pointer('pointermove', 30, 25);
    pointer('pointerup', 30, 25);
    expect(spins()).toBe(1);
  });

  it('never spins from a panel: what has a gesture keeps it', async () => {
    const { spins } = await mount();
    const panel = document.createElement('div');
    panel.setAttribute('data-panel', '');
    document.body.append(panel);
    const pointer = (type: string, x: number): void => {
      panel.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          clientX: x,
          clientY: 0,
          button: 0,
        }),
      );
    };

    pointer('pointerdown', 0);
    pointer('pointermove', 40);
    pointer('pointerup', 40);

    expect(spins()).toBe(0);
    panel.remove();
  });

  it('is animated once running, unless the reader asked for less motion', async () => {
    const moving = await mount();
    expect(moving.fixture.componentInstance.animated()).toBe(true);
    TestBed.resetTestingModule();

    vi.stubGlobal(
      'matchMedia',
      quietMedia((query) => query === '(prefers-reduced-motion: reduce)'),
    );
    TestBed.configureTestingModule({ imports: [ObjectComponent] });
    const fixture = TestBed.createComponent(ObjectComponent);
    await fixture.whenStable();
    expect(fixture.componentInstance.animated()).toBe(false);
  });

  it('falls back to a static disc and drops the targets without a 2D context', async () => {
    const { host, buttons, fixture } = await mount({ context: false });
    expect(host.querySelector('.fallback')).not.toBeNull();
    expect(buttons()).toHaveLength(0);
    expect(fixture.componentInstance.animated()).toBe(false);
  });
});
