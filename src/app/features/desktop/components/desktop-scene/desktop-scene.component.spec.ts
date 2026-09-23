import { TestBed } from '@angular/core/testing';
import { LayoutAnchorsService } from '@shared/ui/services';
import { DesktopSceneComponent } from './desktop-scene.component';
import { DesktopView, Planet } from '../../models';
import { provideTexts } from '@testing/fixtures/texts.fixture';

const BODIES: readonly Planet[] = [
  { slug: 'voice', title: 'Skyted Voice', short: 'Skyted Voice' },
  { slug: 'app', title: 'Skyted App', short: 'Skyted App' },
  { slug: 'statewise', title: 'ngx-statewise', short: 'ngx-statewise' },
  {
    slug: 'template',
    title: 'Template Clean Architecture .NET',
    short: 'Template .NET',
  },
  { slug: 'bk-one', title: 'Bk-ONE', short: 'Bk-ONE' },
];

/**
 * A 2D context that accepts every call and answers itself, so the engine
 * runs in jsdom, which has no canvas. Its drawing is not under test here.
 */
const callable = (): undefined => undefined;

const fakeContext = (): unknown => {
  const proxy: unknown = new Proxy(callable, {
    get: () => proxy,
    set: () => true,
    apply: () => proxy,
  });
  return proxy;
};

/** A media query list that never matches and never changes. */
const quietMedia =
  (isMatching: (query: string) => boolean) => (query: string) => ({
    matches: isMatching(query),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });

const mount = async (
  options: {
    view?: DesktopView;
    preview?: string;
    hovered?: string;
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
  TestBed.configureTestingModule({
    imports: [DesktopSceneComponent],
    providers: [provideTexts()],
  });
  const registry = TestBed.inject(LayoutAnchorsService);
  const lines = Array.from({ length: options.lines ?? 0 }, () => {
    const line = document.createElement('button');
    document.body.append(line);
    registry.register(line, 'line');
    return line;
  });
  const fixture = TestBed.createComponent(DesktopSceneComponent);
  fixture.componentRef.setInput('bodies', BODIES);
  fixture.componentRef.setInput('featured', 4);
  fixture.componentRef.setInput('view', options.view ?? 'home');
  fixture.componentRef.setInput('preview', options.preview ?? null);
  fixture.componentRef.setInput('hovered', options.hovered ?? null);
  const clicked: string[] = [];
  const hovered: (string | null)[] = [];
  let clicksHeard = 0;
  const hearClick = (): void => {
    clicksHeard += 1;
  };
  document.addEventListener('click', hearClick);
  unhear.push(() => {
    document.removeEventListener('click', hearClick);
  });
  fixture.componentInstance.bodyClicked.subscribe((slug) => clicked.push(slug));
  fixture.componentInstance.bodyHovered.subscribe((slug) => hovered.push(slug));
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    host,
    clicked,
    hovered,
    lines,
    clicks: () => clicksHeard,
    buttons: () => [
      ...host.querySelectorAll<HTMLButtonElement>('button[data-scene-target]'),
    ],
  };
};

const frames = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 80));

const unhear: (() => void)[] = [];

describe('DesktopSceneComponent', () => {
  afterEach(() => {
    for (const stop of unhear.splice(0)) {
      stop();
    }
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('the lines of the home rule', () => {
    afterEach(() => {
      document.body.replaceChildren();
    });

    it('keeps them down and out of reach until the rest has arrived', async () => {
      const { lines } = await mount({ lines: 2 });
      await frames();

      for (const line of lines) {
        expect(line.style.opacity).toBe('0');
        expect(line.style.transform).toBe('translateY(9.0px)');
        expect(line.style.pointerEvents).toBe('none');
      }
    });

    it('shows them risen away from the home page, where nothing is waited for', async () => {
      const { lines } = await mount({ view: 'index', lines: 2 });
      await frames();

      for (const line of lines) {
        expect(line.style.opacity).toBe('1');
        expect(line.style.transform).toBe('none');
        expect(line.style.pointerEvents).toBe('auto');
      }
    });
  });

  it('draws on two canvases hidden from assistive technologies', async () => {
    const { host } = await mount();
    const canvases = [...host.querySelectorAll('canvas')];
    expect(canvases).toHaveLength(2);
    for (const canvas of canvases) {
      expect(canvas.getAttribute('aria-hidden')).toBe('true');
    }
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
      [...host.querySelectorAll('.label')].map((label) =>
        label.textContent?.trim(),
      ),
    ).toEqual(['01', '02', '03', '04', '05']);
    expect(buttons()[0]?.hasAttribute('aria-expanded')).toBe(false);
  });

  it('says which body the preview shows', async () => {
    const { buttons } = await mount({ preview: 'app' });
    expect(
      buttons().map((button) => button.getAttribute('aria-expanded')),
    ).toEqual(['false', 'true', 'false', 'false', 'false']);
  });

  it('keeps a body that is not placed yet out of reach', async () => {
    // The home page's planets rise after the crossing: none is drawn yet.
    const { buttons } = await mount();
    for (const button of buttons()) {
      expect(button.getAttribute('aria-hidden')).toBe('true');
      expect(button.tabIndex).toBe(-1);
      expect(button.style.pointerEvents).not.toBe('auto');
    }
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

  it('emits the slug on a click, and on hover and focus, null on leaving', async () => {
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

    expect(clicked).toEqual(['statewise']);
    expect(hovered).toEqual(['statewise', null, 'statewise', null]);
  });

  it('takes two touches without hover: the first reveals, the second opens', async () => {
    const first = await mount({ touch: true });
    first.buttons()[1]?.click();
    expect(first.clicked).toEqual([]);
    expect(first.hovered).toEqual(['app']);
    TestBed.resetTestingModule();

    const second = await mount({ touch: true, hovered: 'app' });
    second.buttons()[1]?.click();
    expect(second.clicked).toEqual(['app']);
  });

  it('selects at the first touch on the index', async () => {
    const { buttons, clicked } = await mount({ view: 'index', touch: true });
    buttons()[0]?.click();
    expect(clicked).toEqual(['voice']);
  });

  it('absorbs the click that ends a drag of more than 6 px, not after a click', async () => {
    const { host, clicks } = await mount();
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
    pointer('click', 12, 11);
    expect(clicks()).toBe(1);

    pointer('pointerdown', 10, 10);
    pointer('pointermove', 30, 25);
    pointer('pointerup', 30, 25);
    pointer('click', 30, 25);
    expect(clicks()).toBe(1);
  });

  it('never turns from a panel: what has a gesture keeps it', async () => {
    const { clicks } = await mount();
    const panel = document.createElement('div');
    panel.dataset['panel'] = '';
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
    pointer('click', 40);

    expect(clicks()).toBe(1);
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
    TestBed.configureTestingModule({
      imports: [DesktopSceneComponent],
      providers: [provideTexts()],
    });
    const fixture = TestBed.createComponent(DesktopSceneComponent);
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
