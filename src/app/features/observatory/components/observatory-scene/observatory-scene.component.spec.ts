import { TestBed } from '@angular/core/testing';
import { SpaceSceneComponent } from '@shared/space-scene/components';
import { LayoutAnchorsService } from '@shared/ui/services';
import { ObservatorySceneComponent } from './observatory-scene.component';
import { ObservatoryView, Planet } from '../../models';
import { stubMedia, stubViewport } from '@testing/doubles/browser.double';
import { componentOf, recordOutput } from '@testing/fixtures/testbed.fixture';
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

const mount = async (
  options: {
    view?: ObservatoryView;
    preview?: string;
    hovered?: string;
    designated?: string;
    context?: boolean;
    reducedMotion?: boolean;
    ruleLines?: number;
  } = {},
) => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () =>
      (options.context === false
        ? null
        : fakeContext()) as CanvasRenderingContext2D | null,
  );
  stubMedia(
    (query) =>
      query === '(prefers-reduced-motion: reduce)' && !!options.reducedMotion,
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
  const clicked = recordOutput(fixture.componentInstance.bodyClicked);
  const hovered = recordOutput(fixture.componentInstance.bodyHovered);
  const chosen = recordOutput(fixture.componentInstance.figureChosen);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    host,
    clicked,
    hovered,
    chosen,
    lines,
    buttons: () => [
      ...host.querySelectorAll<HTMLButtonElement>('button[data-scene-target]'),
    ],
    figures: () => [
      ...host.querySelectorAll<HTMLButtonElement>('button[data-scene-figure]'),
    ],
  };
};

const frames = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 80));

describe('ObservatorySceneComponent', () => {
  afterEach(() => {
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

  it.each([
    {
      case: 'left to the row on a phone held sideways',
      width: 568,
      height: 320,
      labels: 'none',
      emphasised: 'voice',
    },
    {
      case: 'left to the row on a phone held upright',
      width: 320,
      height: 568,
      labels: 'none',
      emphasised: 'voice',
    },
    {
      case: 'written on the sky on a desktop, with no planet lit',
      width: 1280,
      height: 800,
      labels: 'names',
      emphasised: null,
    },
  ])(
    'leaves the name of the planet the row designates $case',
    async ({ width, height, labels, emphasised }) => {
      stubViewport(width, height);
      const { fixture } = await mount({ designated: 'voice' });
      const direction = componentOf(fixture, SpaceSceneComponent).direction();

      expect({
        labels: direction.labels,
        emphasised: direction.emphasised,
      }).toEqual({ labels, emphasised });
    },
  );

  it('draws on two canvases hidden from assistive technologies', async () => {
    const { host } = await mount();
    const canvases = [...host.querySelectorAll('canvas')];
    expect(canvases).toHaveLength(2);
    for (const canvas of canvases) {
      expect(canvas.getAttribute('aria-hidden')).toBe('true');
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

  it('forwards the click and the hover of a body button', async () => {
    const { buttons, clicked, hovered } = await mount();
    const third = buttons()[2];

    third?.click();
    third?.dispatchEvent(
      new PointerEvent('pointerenter', { pointerType: 'mouse' }),
    );

    expect(clicked).toEqual(['statewise']);
    expect(hovered).toEqual(['statewise']);
  });

  it('is animated once running, unless the reader asked for less motion', async () => {
    const moving = await mount();
    expect(moving.fixture.componentInstance.animated()).toBe(true);
    TestBed.resetTestingModule();

    const still = await mount({ reducedMotion: true });
    expect(still.fixture.componentInstance.animated()).toBe(false);
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
  });
});
