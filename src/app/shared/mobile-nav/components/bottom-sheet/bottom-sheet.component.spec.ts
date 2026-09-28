import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { SheetDetent } from '../../models/bottom-sheet.model';
import { BottomSheetComponent } from './bottom-sheet.component';
import {
  MobileNavPlatformDouble,
  provideMobileNavPlatform,
} from '@testing/doubles/mobile-nav-platform.double';
import { pointer } from '@testing/fixtures/pointer.fixture';
import {
  componentOf,
  onPlatform,
  Platform,
} from '@testing/fixtures/testbed.fixture';

const ROOM = 800;
const PEEK = 40;
const HALF = 300;
const END = 660;

@Component({
  imports: [BottomSheetComponent],
  template: `
    <app-bottom-sheet
      [detents]="detents()"
      [detent]="detent()"
      (detentChange)="note($event)"
    >
      <section class="window">
        <div class="bar">
          <h2>Titre</h2>
          <button type="button">Baisser</button>
        </div>
        <div class="body">Corps</div>
      </section>
    </app-bottom-sheet>
  `,
})
class SheetHost {
  public readonly detents = signal<readonly SheetDetent[]>([
    'folded',
    'half',
    'full',
  ]);
  public readonly detent = signal<SheetDetent>('half');
  public readonly changes: SheetDetent[] = [];

  public note(detent: SheetDetent): void {
    this.changes.push(detent);
    this.detent.set(detent);
  }
}

const define = (element: Element, name: string, value: unknown): void => {
  Object.defineProperty(element, name, { value, configurable: true });
};

const stamped = <T extends Event>(event: T, at: number): T => {
  Object.defineProperty(event, 'timeStamp', { value: at });
  return event;
};

const setup = async ({
  platform: where = 'browser',
  compact = true,
}: { readonly platform?: Platform; readonly compact?: boolean } = {}) => {
  const platform = new MobileNavPlatformDouble();
  platform.compact.set(compact);
  onPlatform(where);
  TestBed.configureTestingModule({
    imports: [SheetHost],
    providers: [provideMobileNavPlatform(platform)],
  });
  const observed = vi.spyOn(platform, 'onResize');
  const fixture = TestBed.createComponent(SheetHost);
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const host = root.querySelector('app-bottom-sheet') as HTMLElement;
  const rail = host.querySelector('.rail') as HTMLElement;
  const content = host.querySelector('.content') as HTMLElement;
  const bar = host.querySelector('.bar') as HTMLElement;
  let top = 0;
  let room = ROOM;
  let end = END;
  Object.defineProperty(rail, 'scrollTop', {
    get: () => top,
    set: (value: number) => {
      top = value;
    },
    configurable: true,
  });
  Object.defineProperty(rail, 'clientHeight', {
    get: () => room,
    configurable: true,
  });
  Object.defineProperty(content, 'offsetTop', {
    get: () => room - PEEK,
    configurable: true,
  });
  Object.defineProperty(content, 'offsetHeight', {
    get: () => end + PEEK,
    configurable: true,
  });
  const scrollTo = vi.fn((options: ScrollToOptions) => {
    if (options.behavior === 'instant') {
      top = options.top ?? top;
    }
  });
  define(rail, 'scrollTo', scrollTo);
  define(host.querySelector('.half') as HTMLElement, 'offsetHeight', HALF);
  define(content, 'getBoundingClientRect', () => new DOMRect(0, 0, 390, 700));
  define(bar, 'getBoundingClientRect', () => new DOMRect(0, 0, 390, PEEK));
  const sheet = componentOf(fixture, BottomSheetComponent);
  const settle = async (): Promise<void> => {
    await fixture.whenStable();
  };
  const scrollBy = (to: number, at: number): void => {
    top = to;
    rail.dispatchEvent(stamped(new Event('scroll'), at));
  };
  const touch = (type: string, at: number): void => {
    const event = stamped(new Event(type), at);
    Object.defineProperty(event, 'touches', { value: [] });
    rail.dispatchEvent(event);
  };
  return {
    fixture,
    platform,
    observed,
    host,
    rail,
    bar,
    sheet,
    scrollTo,
    changes: fixture.componentInstance.changes,
    top: () => top,
    lay: async (): Promise<void> => {
      sheet.hold(bar);
      platform.resize();
      platform.frame();
      await settle();
    },
    resize: async (height: number, content = END): Promise<void> => {
      room = height;
      end = content;
      platform.resize();
      platform.frame();
      await settle();
    },
    drag: async (moves: readonly (readonly [number, number])[]) => {
      const first = moves[0]?.[1] ?? 0;
      touch('touchstart', first);
      for (const [to, at] of moves) {
        scrollBy(to, at);
      }
      touch('touchend', moves.at(-1)?.[1] ?? first);
      await settle();
    },
    rest: async (to: number, events = ['scroll', 'scrollend']) => {
      top = to;
      for (const type of events) {
        rail.dispatchEvent(new Event(type));
      }
      await settle();
    },
  };
};

describe('BottomSheetComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rests at half once laid out, put there at once, its band and peek written for the page', async () => {
    const { host, scrollTo, changes, lay } = await setup();

    await lay();

    expect(host.dataset['active']).toBe('true');
    expect(host.dataset['detent']).toBe('half');
    expect(scrollTo).toHaveBeenCalledWith({
      top: HALF - PEEK,
      behavior: 'instant',
    });
    expect(host.style.getPropertyValue('--mnav-sheet-peek')).toBe('40px');
    expect(host.style.getPropertyValue('--mnav-sheet-band')).toBe('300px');
    expect(changes).toEqual([]);
  });

  it('says where a drag let it go only once the scroll has ended', async () => {
    const { host, scrollTo, changes, lay, drag, rest } = await setup();
    await lay();

    await drag([
      [260, 0],
      [300, 100],
      [340, 200],
    ]);

    expect(scrollTo).toHaveBeenLastCalledWith({ top: END, behavior: 'smooth' });
    expect(host.dataset['detent']).toBe('half');
    expect(changes).toEqual([]);

    await rest(END, ['scroll']);

    expect(changes).toEqual([]);

    await rest(END, ['scrollend']);

    expect(changes).toEqual(['full']);
    expect(host.dataset['detent']).toBe('full');
    expect(host.style.getPropertyValue('--mnav-sheet-band')).toBe('700px');
  });

  it('goes back to where it rested after a short slow drag', async () => {
    const { scrollTo, changes, lay, drag, rest } = await setup();
    await lay();

    await drag([
      [260, 0],
      [240, 100],
      [230, 200],
    ]);

    expect(scrollTo).toHaveBeenLastCalledWith({
      top: HALF - PEEK,
      behavior: 'smooth',
    });

    await rest(HALF - PEEK);

    expect(changes).toEqual([]);
  });

  it('folds on a short flick down, by the speed of the release', async () => {
    const { scrollTo, changes, lay, drag, rest } = await setup();
    await lay();

    await drag([
      [260, 0],
      [250, 10],
      [230, 30],
    ]);

    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });

    await rest(0);

    expect(changes).toEqual(['folded']);
  });

  it('settles 120 ms after the last scroll where the browser has no scrollend', async () => {
    const { platform, changes, lay, drag, rest, fixture } = await setup();
    platform.knowsScrollEnd = false;
    await lay();

    await drag([
      [260, 0],
      [300, 100],
      [340, 200],
    ]);
    await rest(END, ['scroll']);

    expect(changes).toEqual([]);

    platform.elapse(120);
    await fixture.whenStable();

    expect(changes).toEqual(['full']);
  });

  it('lowers to folded and back from its fold control, the detent said at the end of each scroll', async () => {
    const { sheet, scrollTo, changes, lay, rest } = await setup();
    await lay();

    sheet.toggle();

    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });
    expect(changes).toEqual([]);

    await rest(0);
    sheet.toggle();

    expect(scrollTo).toHaveBeenLastCalledWith({
      top: HALF - PEEK,
      behavior: 'smooth',
    });

    await rest(HALF - PEEK);

    expect(changes).toEqual(['folded', 'half']);
  });

  it('goes and says so at once under reduced motion', async () => {
    const { platform, sheet, scrollTo, changes, lay, fixture } = await setup();
    platform.isReduced = true;
    await lay();

    sheet.toggle();
    await fixture.whenStable();

    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' });
    expect(changes).toEqual(['folded']);
  });

  it('rises from a tap on its folded handle, but not from a button of it', async () => {
    const { sheet, bar, scrollTo, lay, rest } = await setup();
    await lay();
    sheet.toggle();
    await rest(0);
    const outside = vi.fn();
    bar.addEventListener('pointerup', outside);

    bar
      .querySelector('button')
      ?.dispatchEvent(pointer('pointerup', { x: 300, y: 10 }));

    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });
    expect(outside).toHaveBeenCalledOnce();

    bar
      .querySelector('h2')
      ?.dispatchEvent(pointer('pointerup', { x: 20, y: 10 }));

    expect(scrollTo).toHaveBeenLastCalledWith({
      top: HALF - PEEK,
      behavior: 'smooth',
    });
    expect(outside).toHaveBeenCalledOnce();
  });

  it('goes after the next frame to a detent set from outside', async () => {
    const { fixture, platform, scrollTo, host, lay, rest } = await setup();
    await lay();

    fixture.componentInstance.detent.set('full');
    await fixture.whenStable();

    expect(scrollTo).not.toHaveBeenLastCalledWith({
      top: END,
      behavior: 'smooth',
    });

    platform.frame();

    expect(scrollTo).toHaveBeenLastCalledWith({ top: END, behavior: 'smooth' });

    await rest(END);

    expect(host.dataset['detent']).toBe('full');
  });

  it('is shown again at the detent it was left at, and follows its content there', async () => {
    const { host, scrollTo, lay, drag, rest, resize, top } = await setup();
    await lay();
    await drag([
      [260, 0],
      [340, 200],
    ]);
    await rest(END);
    scrollTo.mockClear();

    await resize(0);
    await resize(ROOM);

    expect(scrollTo).not.toHaveBeenCalled();
    expect(host.dataset['detent']).toBe('full');

    await resize(ROOM, 720);

    expect(top()).toBe(720);
    expect(host.dataset['detent']).toBe('full');
  });

  it('shades the sky it leaves only between half and full, and never for a sheet without both', async () => {
    const { fixture, host, lay, resize } = await setup();
    await lay();

    expect(host.dataset['rising']).toBe('');
    expect(host.style.getPropertyValue('--mnav-sheet-shade-from')).toBe(
      '260px',
    );

    fixture.componentInstance.detents.set(['folded', 'half']);
    await fixture.whenStable();
    await resize(ROOM);

    expect(host.dataset['rising']).toBeUndefined();
  });

  it('keeps out of the way beyond the phone: no scroll, and its fold is left to the window', async () => {
    const { host, sheet, scrollTo, lay } = await setup({ compact: false });
    await lay();

    sheet.toggle();

    expect(host.dataset['active']).toBeUndefined();
    expect(scrollTo).not.toHaveBeenCalled();
    expect(host.dataset['detent']).toBe('half');
  });

  it('is inert on the server: it observes nothing and scrolls nothing', async () => {
    const { host, observed, scrollTo, platform } = await setup({
      platform: 'server',
    });

    platform.resize();
    platform.frame();

    expect(observed).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();
    expect(host.dataset['detent']).toBe('half');
  });
});
