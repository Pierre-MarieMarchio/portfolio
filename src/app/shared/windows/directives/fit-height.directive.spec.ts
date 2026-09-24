import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WindowAnchor } from '../models/window.model';
import { FitHeightDirective } from './fit-height.directive';

const stubViewportHeight = (height: number): (() => void) => {
  const descriptor = Object.getOwnPropertyDescriptor(window, 'innerHeight');
  Object.defineProperty(window, 'innerHeight', {
    value: height,
    configurable: true,
  });
  return () => {
    if (descriptor) {
      Object.defineProperty(window, 'innerHeight', descriptor);
    }
  };
};

const stubViewportWidth = (width: number): (() => void) => {
  const descriptor = Object.getOwnPropertyDescriptor(window, 'innerWidth');
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    configurable: true,
  });
  return () => {
    if (descriptor) {
      Object.defineProperty(window, 'innerWidth', descriptor);
    }
  };
};

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
  });

  const setup = async (
    layout: { offsetTop: number; offsetHeight?: number },
    viewportHeight: number,
  ) => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    const host = fixture.nativeElement as HTMLElement;
    const section = host.querySelector('section') as HTMLElement;
    restorers.push(
      stubLayout(section, layout),
      stubViewportHeight(viewportHeight),
    );
    await fixture.whenStable();
    const refit = async (): Promise<void> => {
      window.dispatchEvent(new Event('resize'));
      await fixture.whenStable();
    };
    return { fixture, host, section, refit };
  };

  it('keeps to its ceiling when the screen has room to spare', async () => {
    const { section } = await setup({ offsetTop: 100 }, 2000);

    expect(section.style.maxHeight).toBe('470px');
  });

  it('takes the room left under its layout top, minus the reserve', async () => {
    const { section } = await setup({ offsetTop: 100 }, 500);

    expect(section.style.maxHeight).toBe('374px');
  });

  it('keeps 200px however cramped the screen', async () => {
    const { section } = await setup({ offsetTop: 750 }, 800);

    expect(section.style.maxHeight).toBe('200px');
  });

  it('reads the reserve from --window-reserve, inherited from where it sits', async () => {
    const { fixture, section } = await setup({ offsetTop: 100 }, 500);

    fixture.componentInstance.reserve.set('76px');
    await fixture.whenStable();

    expect(section.style.maxHeight).toBe('324px');
  });

  it('reserves nothing when no --window-reserve is set', async () => {
    const { fixture, section } = await setup({ offsetTop: 100 }, 500);

    fixture.componentInstance.reserve.set('');
    await fixture.whenStable();

    expect(section.style.maxHeight).toBe('400px');
  });

  it('measures from the layout position, which a transform leaves alone', async () => {
    const { fixture, section } = await setup({ offsetTop: 100 }, 500);
    section.style.transform = 'translate(0px,200px)';
    section.getBoundingClientRect = () => new DOMRect(0, 300, 400, 100);

    fixture.componentInstance.reserve.set('76px');
    await fixture.whenStable();

    expect(section.style.maxHeight).toBe('324px');
  });

  it('counts from where its offset parent sits on the screen', async () => {
    const { host, fixture, section } = await setup({ offsetTop: 100 }, 500);
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

    expect(section.style.maxHeight).toBe('274px');
  });

  it('measures from its bottom edge when anchored at the bottom', async () => {
    const { fixture, section } = await setup(
      { offsetTop: 100, offsetHeight: 300 },
      2000,
    );

    fixture.componentInstance.anchor.set('bottom');
    fixture.componentInstance.reserve.set('88px');
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

    restorers.push(stubViewportWidth(390));
    await refit();

    expect(section.style.maxHeight).toBe('');
  });

  it('fits again when the screen is resized', async () => {
    const { section, refit } = await setup({ offsetTop: 100 }, 800);
    expect(section.style.maxHeight).toBe('470px');

    restorers.push(stubViewportHeight(500));
    await refit();

    expect(section.style.maxHeight).toBe('374px');
  });

  it('fits again once an animation of its own ends', async () => {
    const { section } = await setup({ offsetTop: 100 }, 800);
    restorers.push(stubViewportHeight(500));

    section.dispatchEvent(new Event('animationend'));

    expect(section.style.maxHeight).toBe('374px');
  });

  it('stops listening to resize once destroyed', async () => {
    const { fixture, section } = await setup({ offsetTop: 100 }, 800);

    fixture.destroy();
    restorers.push(stubViewportHeight(500));
    window.dispatchEvent(new Event('resize'));

    expect(section.style.maxHeight).toBe('470px');
  });
});
