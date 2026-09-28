import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WindowAnchor } from '../models/window.model';
import { FitHeightDirective } from './fit-height.directive';

const stubLayout = (
  element: HTMLElement,
  layout: { offsetTop: number; offsetHeight?: number },
): (() => void) => {
  for (const [key, value] of Object.entries(layout)) {
    Object.defineProperty(element, key, { value, configurable: true });
  }
  return () => {
    for (const key of Object.keys(layout)) {
      Reflect.deleteProperty(element, key);
    }
  };
};

@Component({
  imports: [FitHeightDirective],
  template: `
    <div class="place" [style.--window-reserve]="reserve()">
      <section [appFitHeight]="ceiling()" [anchor]="anchor()"></section>
    </div>
  `,
})
class Host {
  public readonly ceiling = signal<number | null>(470);
  public readonly anchor = signal<WindowAnchor>('top');
  public readonly reserve = signal('26px');
}

describe('FitHeightDirective', () => {
  const restorers: (() => void)[] = [];

  afterEach(() => {
    while (restorers.length > 0) {
      restorers.pop()?.();
    }
    vi.unstubAllGlobals();
  });

  const setup = async (
    layout: { offsetTop: number; offsetHeight?: number },
    viewportHeight: number,
  ) => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    const host = fixture.nativeElement as HTMLElement;
    const section = host.querySelector('section') as HTMLElement;
    restorers.push(stubLayout(section, layout));
    vi.stubGlobal('innerHeight', viewportHeight);
    await fixture.whenStable();
    const refit = async (): Promise<void> => {
      window.dispatchEvent(new Event('resize'));
      await fixture.whenStable();
    };
    return { fixture, host, section, refit };
  };

  it.each([
    {
      room: 'keeps to its ceiling when the screen has room to spare',
      offsetTop: 100,
      viewportHeight: 2000,
      maxHeight: '470px',
    },
    {
      room: 'takes the room left under its layout top, minus the reserve',
      offsetTop: 100,
      viewportHeight: 500,
      maxHeight: '374px',
    },
    {
      room: 'keeps 200px however cramped the screen',
      offsetTop: 750,
      viewportHeight: 800,
      maxHeight: '200px',
    },
  ])('$room', async ({ offsetTop, viewportHeight, maxHeight }) => {
    const { section } = await setup({ offsetTop }, viewportHeight);

    expect(section.style.maxHeight).toBe(maxHeight);
  });

  it('reads the reserve from --window-reserve, inherited from where it sits', async () => {
    const { fixture, section, refit } = await setup({ offsetTop: 100 }, 500);

    fixture.componentInstance.reserve.set('76px');
    await fixture.whenStable();
    await refit();

    expect(section.style.maxHeight).toBe('324px');
  });

  it('reserves nothing when no --window-reserve is set', async () => {
    const { fixture, section, refit } = await setup({ offsetTop: 100 }, 500);

    fixture.componentInstance.reserve.set('');
    await fixture.whenStable();
    await refit();

    expect(section.style.maxHeight).toBe('400px');
  });

  it('measures from the layout position, which a transform leaves alone', async () => {
    const { fixture, section, refit } = await setup({ offsetTop: 100 }, 500);
    section.style.transform = 'translate(0px,200px)';
    section.getBoundingClientRect = () => new DOMRect(0, 300, 400, 100);

    fixture.componentInstance.reserve.set('76px');
    await fixture.whenStable();
    await refit();

    expect(section.style.maxHeight).toBe('324px');
  });

  it('counts from where its offset parent sits on the screen', async () => {
    const { host, fixture, section, refit } = await setup(
      { offsetTop: 100 },
      500,
    );
    const place = host.querySelector('.place') as HTMLElement;
    place.getBoundingClientRect = () => new DOMRect(0, 50, 400, 400);
    restorers.push(
      stubLayout(section, { offsetTop: 100 }),
      (() => {
        Object.defineProperty(section, 'offsetParent', {
          value: place,
          configurable: true,
        });
        return () => Reflect.deleteProperty(section, 'offsetParent');
      })(),
    );

    fixture.componentInstance.reserve.set('76px');
    await fixture.whenStable();
    await refit();

    expect(section.style.maxHeight).toBe('274px');
  });

  it('measures from its bottom edge when anchored at the bottom', async () => {
    const { fixture, section } = await setup(
      { offsetTop: 100, offsetHeight: 300 },
      2000,
    );

    fixture.componentInstance.reserve.set('88px');
    fixture.componentInstance.anchor.set('bottom');
    await fixture.whenStable();

    expect(section.style.maxHeight).toBe('312px');
  });

  it('bounds nothing while its ceiling is null', async () => {
    const { fixture, section } = await setup({ offsetTop: 100 }, 500);

    fixture.componentInstance.ceiling.set(null);
    await fixture.whenStable();

    expect(section.style.maxHeight).toBe('');
  });

  it('bounds nothing at the phone format', async () => {
    const { section, refit } = await setup({ offsetTop: 500 }, 844);
    expect(section.style.maxHeight).toBe('318px');

    vi.stubGlobal('innerWidth', 390);
    await refit();

    expect(section.style.maxHeight).toBe('');
  });

  it('fits again when the screen is resized', async () => {
    const { section, refit } = await setup({ offsetTop: 100 }, 800);
    expect(section.style.maxHeight).toBe('470px');

    vi.stubGlobal('innerHeight', 500);
    await refit();

    expect(section.style.maxHeight).toBe('374px');
  });

  it('fits again once an animation of its own ends', async () => {
    const { section } = await setup({ offsetTop: 100 }, 800);
    vi.stubGlobal('innerHeight', 500);

    section.dispatchEvent(new Event('animationend'));

    expect(section.style.maxHeight).toBe('374px');
  });

  it('fits again when its own size changes', async () => {
    const observed: (() => void)[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        public constructor(private readonly fn: () => void) {}
        public observe(): void {
          observed.push(this.fn);
        }
        public disconnect(): void {
          observed.length = 0;
        }
      },
    );
    const { section } = await setup({ offsetTop: 100 }, 800);
    vi.stubGlobal('innerHeight', 500);

    for (const fn of observed) {
      fn();
    }

    expect(section.style.maxHeight).toBe('374px');
  });

  it('does not fit on a render that changes none of its inputs', async () => {
    const { fixture, section } = await setup({ offsetTop: 100 }, 800);
    vi.stubGlobal('innerHeight', 500);

    fixture.componentInstance.reserve.set('10px');
    await fixture.whenStable();

    expect(section.style.maxHeight).toBe('470px');
  });

  it('stops listening to resize once destroyed', async () => {
    const { fixture, section } = await setup({ offsetTop: 100 }, 800);

    fixture.destroy();
    vi.stubGlobal('innerHeight', 500);
    window.dispatchEvent(new Event('resize'));

    expect(section.style.maxHeight).toBe('470px');
  });
});
