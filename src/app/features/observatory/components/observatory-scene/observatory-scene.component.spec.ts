import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SpaceSceneComponent } from '@shared/space-scene/components';
import { LayoutAnchorsService } from '@shared/ui/services';
import { ObservatorySceneComponent } from './observatory-scene.component';
import { ObservatoryView, Planet } from '../../models';
import { provideTexts } from '@testing/fixtures/texts.fixture';
import { OBSERVATORY_TEXTS } from '../../ports';

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

const callable = (): undefined => undefined;

const fakeContext = (): unknown => {
  const proxy: unknown = new Proxy(callable, {
    get: () => proxy,
    set: () => true,
    apply: () => proxy,
  });
  return proxy;
};

const quietMedia =
  (isMatching: (query: string) => boolean) => (query: string) => ({
    matches: isMatching(query),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });

const mount = async (
  options: {
    view?: ObservatoryView;
    preview?: string;
    hovered?: string;
    designated?: string;
    context?: boolean;
    touch?: boolean;
    ruleLines?: number;
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
    imports: [ObservatorySceneComponent],
    providers: [provideTexts()],
  });
  const registry = TestBed.inject(LayoutAnchorsService);
  const lines = Array.from({ length: options.ruleLines ?? 0 }, () => {
    const line = document.createElement('button');
    document.body.append(line);
    registry.register(line, 'line');
    return line;
  });
  const fixture = TestBed.createComponent(ObservatorySceneComponent);
  fixture.componentRef.setInput('bodies', BODIES);
  fixture.componentRef.setInput('featured', 4);
  fixture.componentRef.setInput('view', options.view ?? 'home');
  fixture.componentRef.setInput('preview', options.preview ?? null);
  fixture.componentRef.setInput('hovered', options.hovered ?? null);
  fixture.componentRef.setInput('designated', options.designated ?? null);
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
  const chosen: number[] = [];
  fixture.componentInstance.figureChosen.subscribe((figure) =>
    chosen.push(figure),
  );
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    host,
    clicked,
    hovered,
    chosen,
    lines,
    clicks: () => clicksHeard,
    buttons: () => [
      ...host.querySelectorAll<HTMLButtonElement>('button[data-scene-target]'),
    ],
    figures: () => [
      ...host.querySelectorAll<HTMLButtonElement>('button[data-scene-figure]'),
    ],
  };
};

const holdViewport = (width: number, height: number): void => {
  const kept = {
    innerWidth: Object.getOwnPropertyDescriptor(window, 'innerWidth'),
    innerHeight: Object.getOwnPropertyDescriptor(window, 'innerHeight'),
  };
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    configurable: true,
  });
  Object.defineProperty(window, 'innerHeight', {
    value: height,
    configurable: true,
  });
  unhear.push(() => {
    for (const [size, descriptor] of Object.entries(kept)) {
      if (descriptor) {
        Object.defineProperty(window, size, descriptor);
      }
    }
  });
};

const directionAt = async (width: number, height: number) => {
  holdViewport(width, height);
  const { fixture } = await mount({ designated: 'voice' });
  const scene = fixture.debugElement.query(By.directive(SpaceSceneComponent))
    .componentInstance as SpaceSceneComponent;
  const { labels, emphasised } = scene.direction();
  return { labels, emphasised };
};

const frames = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 80));

const unhear: (() => void)[] = [];

describe('ObservatorySceneComponent', () => {
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
      const { lines } = await mount({ ruleLines: 2 });
      await frames();

      for (const line of lines) {
        expect(line.style.opacity).toBe('0');
        expect(line.style.transform).toBe('translateY(9.0px)');
        expect(line.style.pointerEvents).toBe('none');
      }
    });

    it('shows them risen away from the home page, where nothing is waited for', async () => {
      const { lines } = await mount({ view: 'index', ruleLines: 2 });
      await frames();

      for (const line of lines) {
        expect(line.style.opacity).toBe('1');
        expect(line.style.transform).toBe('none');
        expect(line.style.pointerEvents).toBe('auto');
      }
    });
  });

  describe('the name of the planet the row designates', () => {
    it('is left to the row on a phone held sideways', async () => {
      expect(await directionAt(568, 320)).toEqual({
        labels: 'none',
        emphasised: 'voice',
      });
    });

    it('is left to the row on a phone held upright', async () => {
      expect(await directionAt(320, 568)).toEqual({
        labels: 'none',
        emphasised: 'voice',
      });
    });

    it('is written on the sky on a desktop, with no planet lit', async () => {
      expect(await directionAt(1280, 800)).toEqual({
        labels: 'names',
        emphasised: null,
      });
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

  it('names them as list selections on the index, under numbered labels', async () => {
    const { buttons, host } = await mount({ view: 'index' });
    expect(buttons()[3]?.textContent?.trim()).toBe(
      'Afficher Template Clean Architecture .NET dans la liste',
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
    third.dispatchEvent(
      new PointerEvent('pointerenter', { pointerType: 'mouse' }),
    );
    third.dispatchEvent(
      new PointerEvent('pointerleave', { pointerType: 'mouse' }),
    );
    third.focus();
    third.blur();

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
    const pointer = (type: string, x: number, y: number): void => {
      const event = new PointerEvent(type, {
        bubbles: true,
        clientX: x,
        clientY: y,
        button: 0,
        isPrimary: true,
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
        new PointerEvent(type, {
          bubbles: true,
          clientX: x,
          clientY: 0,
          button: 0,
          isPrimary: true,
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
      imports: [ObservatorySceneComponent],
      providers: [provideTexts()],
    });
    const fixture = TestBed.createComponent(ObservatorySceneComponent);
    await fixture.whenStable();
    expect(fixture.componentInstance.animated()).toBe(false);
  });

  it('falls back to a static disc and drops the targets without a 2D context', async () => {
    const { host, buttons, fixture } = await mount({ context: false });
    expect(host.querySelector('.fallback')).not.toBeNull();
    expect(buttons()).toHaveLength(0);
    expect(fixture.componentInstance.animated()).toBe(false);
  });

  describe('the figures of the about view', () => {
    it('lays one button per section, named after it', async () => {
      const { figures } = await mount({ view: 'about' });
      await frames();

      expect(
        figures().map((figure) => figure.getAttribute('aria-label')),
      ).toEqual(TestBed.inject(OBSERVATORY_TEXTS)().object.parts);
    });

    it('lays the live targets on the stage, above the sky, where the pointer reaches them', async () => {
      const { host, figures } = await mount({ view: 'about' });
      await frames();
      const stage = host.querySelector('.stage');
      const sky = host.querySelector('.sky');
      const live = figures().filter(
        (figure) => figure.getAttribute('aria-hidden') === 'false',
      );

      expect(live.length).toBeGreaterThan(0);
      for (const figure of live) {
        expect(figure.parentElement).toBe(stage);
        expect(getComputedStyle(figure).pointerEvents).toBe('auto');
        expect(figure.tabIndex).toBe(0);
      }
      expect(Number(stage && getComputedStyle(stage).zIndex)).toBeGreaterThan(
        Number(sky && getComputedStyle(sky).zIndex),
      );
    });

    it('chooses the section of the figure clicked', async () => {
      const { figures, chosen } = await mount({ view: 'about' });
      await frames();

      figures()[2]?.click();

      expect(chosen).toEqual([2]);
    });

    it('does not choose a section at the end of a drag of more than 6 px', async () => {
      const { figures, chosen } = await mount({ view: 'about' });
      await frames();
      const figure = figures()[1];

      figure?.dispatchEvent(
        new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }),
      );
      figure?.dispatchEvent(
        new MouseEvent('click', { clientX: 110, clientY: 100, detail: 1 }),
      );
      figure?.dispatchEvent(
        new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }),
      );
      figure?.dispatchEvent(
        new MouseEvent('click', { clientX: 104, clientY: 103, detail: 1 }),
      );

      expect(chosen).toEqual([1]);
    });

    it('keeps every figure button inert out of the about view', async () => {
      const { figures } = await mount({ view: 'home' });
      await frames();

      expect(figures()).toHaveLength(4);
      for (const figure of figures()) {
        expect(figure.getAttribute('aria-hidden')).toBe('true');
        expect(figure.tabIndex).toBe(-1);
        expect(figure.style.pointerEvents).toBe('none');
      }
    });
  });
});
