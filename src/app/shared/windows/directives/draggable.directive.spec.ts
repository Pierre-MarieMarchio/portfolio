import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DraggableDirective } from './draggable.directive';

const stubRect = (
  el: Element,
  rect: { top: number; left: number; width: number; height: number },
): (() => void) => {
  const original = el.getBoundingClientRect.bind(el);
  const domRect: DOMRect = {
    ...rect,
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

const pointer = (
  type: string,
  init: { clientX: number; clientY: number; button?: number },
): Event =>
  new PointerEvent(type, { bubbles: true, cancelable: true, ...init });

@Component({
  imports: [DraggableDirective],
  template: `
    <section [appDraggable]="useOther() ? other : handle">
      <div #handle class="handle">
        <span class="grip">grip</span>
        <button type="button">button</button>
        <a href="#top">link</a>
      </div>
      <div #other class="other"></div>
      <p>{{ renders() }}</p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  public readonly useOther = signal(false);
  public count = 0;

  public renders(): number {
    this.count += 1;
    return this.count;
  }
}

const move = (clientX: number, clientY: number): void => {
  window.dispatchEvent(pointer('pointermove', { clientX, clientY }));
};

const RECT = { top: 300, left: 500, width: 200, height: 150 };

describe('DraggableDirective', () => {
  const restorers: (() => void)[] = [];

  afterEach(() => {
    while (restorers.length > 0) {
      restorers.pop()?.();
    }
  });

  const setup = async () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const section = host.querySelector('section') as HTMLElement;
    const handle = host.querySelector('.handle') as HTMLElement;
    const grip = host.querySelector('.grip') as HTMLElement;
    restorers.push(stubRect(section, RECT), stubViewport(1200, 800));
    const grab = (from: Element = grip, button = 0): void => {
      from.dispatchEvent(
        pointer('pointerdown', { clientX: 600, clientY: 400, button }),
      );
    };
    return { fixture, host, section, handle, grab };
  };

  it('moves the element by as much as the pointer, from its handle', async () => {
    const { section, grab } = await setup();

    grab();
    move(650, 430);

    expect(section.style.transform).toBe('translate(50px,30px)');
  });

  it('carries on from where the last move left it', async () => {
    const { section, grab } = await setup();

    grab();
    move(650, 430);
    window.dispatchEvent(pointer('pointerup', { clientX: 650, clientY: 430 }));
    grab();
    move(610, 410);

    expect(section.style.transform).toBe('translate(60px,40px)');
  });

  it.each([
    ['left', -1400, 400, 'translate(-534px,0px)'],
    ['right', 2600, 400, 'translate(550px,0px)'],
    ['top', 600, -1600, 'translate(0px,-288px)'],
    ['bottom', 600, 2400, 'translate(0px,440px)'],
  ])(
    'keeps the element within the screen past the %s edge',
    async (_edge, clientX, clientY, transform) => {
      const { section, grab } = await setup();

      grab();
      move(clientX, clientY);

      expect(section.style.transform).toBe(transform);
    },
  );

  it('does not start from a button or a link inside the handle', async () => {
    const { host, section, grab } = await setup();

    for (const control of host.querySelectorAll('button, a')) {
      grab(control);
      move(900, 700);
    }

    expect(section.style.transform).toBe('');
  });

  it('does not start from outside its handle', async () => {
    const { host, section, grab } = await setup();

    grab(host.querySelector('p') as HTMLElement);
    move(900, 700);

    expect(section.style.transform).toBe('');
  });

  it('ignores a pointer button other than the primary one', async () => {
    const { section, grab } = await setup();

    grab(undefined, 2);
    move(900, 700);

    expect(section.style.transform).toBe('');
  });

  it.each(['pointerup', 'pointercancel'])(
    'stops moving after %s',
    async (end) => {
      const { section, grab } = await setup();

      grab();
      move(650, 430);
      window.dispatchEvent(pointer(end, { clientX: 650, clientY: 430 }));
      move(900, 700);

      expect(section.style.transform).toBe('translate(50px,30px)');
    },
  );

  it('shows a grabbing cursor on the handle while it moves', async () => {
    const { handle, grab } = await setup();

    grab();
    expect(handle.style.cursor).toBe('grabbing');

    window.dispatchEvent(pointer('pointerup', { clientX: 600, clientY: 400 }));
    expect(handle.style.cursor).toBe('');
  });

  it('follows a new handle, and lets the old one go', async () => {
    const { fixture, host, section, grab } = await setup();

    fixture.componentInstance.useOther.set(true);
    await fixture.whenStable();
    grab();
    move(900, 700);
    expect(section.style.transform).toBe('');

    grab(host.querySelector('.other') as HTMLElement);
    move(650, 430);
    expect(section.style.transform).toBe('translate(50px,30px)');
  });

  it('renders nothing while the pointer moves', async () => {
    const { fixture, grab } = await setup();
    const before = fixture.componentInstance.count;

    grab();
    move(610, 405);
    move(620, 410);
    await fixture.whenStable();
    window.dispatchEvent(pointer('pointerup', { clientX: 620, clientY: 410 }));
    await fixture.whenStable();

    expect(fixture.componentInstance.count).toBe(before);
  });

  it('stops listening once destroyed, even in the middle of a move', async () => {
    const { fixture, section, grab } = await setup();

    grab();
    move(650, 430);
    fixture.destroy();
    move(900, 700);

    expect(section.style.transform).toBe('translate(50px,30px)');
  });
});
