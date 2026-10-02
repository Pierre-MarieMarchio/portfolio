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
      [transient]="transient()"
      (detentChange)="note($event)"
      (dismissed)="dismissals = dismissals + 1"
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
  public readonly transient = signal(false);
  public readonly changes: SheetDetent[] = [];
  public dismissals = 0;

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
  const touch = (type: string, at: number, y = 0): void => {
    const event = stamped(new Event(type), at);
    Object.defineProperty(event, 'touches', {
      value: type === 'touchend' ? [] : [{ clientY: y }],
    });
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
    drag: async (moves: readonly (readonly [number, number])[], pull = 0) => {
      const first = moves[0]?.[1] ?? 0;
      touch('touchstart', first, 300);
      for (const [to, at] of moves) {
        scrollBy(to, at);
      }
      touch('touchmove', moves.at(-1)?.[1] ?? first, 300 + pull);
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

const foldedSheet = async (isTransient: boolean) => {
  const setups = await setup();
  setups.fixture.componentInstance.transient.set(isTransient);
  await setups.lay();
  setups.sheet.toggle();
  await setups.rest(0);
  return setups;
};

const risen = async (hasCloseWatcher: boolean) => {
  const setups = await setup();
  setups.platform.hasCloseWatcher = hasCloseWatcher;
  await setups.lay();
  setups.fixture.componentInstance.detent.set('full');
  await setups.fixture.whenStable();
  setups.platform.frame();
  await setups.rest(END);
  return setups;
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

  describe('vibration', () => {
    it('vibrates lightly once a drag lets it rest on another detent, and not before', async () => {
      const { platform, lay, drag, rest } = await setup();
      await lay();

      await drag([
        [260, 0],
        [300, 100],
        [340, 200],
      ]);

      expect(platform.vibrations).toEqual([]);

      await rest(END);

      expect(platform.vibrations).toEqual([10]);
    });

    it('vibrates once its handle is tapped to another detent', async () => {
      const { platform, sheet, lay, rest } = await setup();
      await lay();

      sheet.toggle();
      await rest(0);

      expect(platform.vibrations).toEqual([10]);
    });

    it('vibrates when a reduced-motion drag or toggle is put there at once', async () => {
      const { platform, sheet, lay, fixture } = await setup();
      platform.isReduced = true;
      await lay();

      sheet.toggle();
      await fixture.whenStable();

      expect(platform.vibrations).toEqual([10]);
    });

    it('stays still when a drag lets it rest where it was', async () => {
      const { platform, lay, drag, rest } = await setup();
      await lay();

      await drag([
        [260, 0],
        [240, 100],
        [230, 200],
      ]);
      await rest(HALF - PEEK);

      expect(platform.vibrations).toEqual([]);
    });

    it('stays still when the page sets the detent, and when it is resized', async () => {
      const { fixture, platform, lay, rest, resize } = await setup();
      await lay();

      fixture.componentInstance.detent.set('full');
      await fixture.whenStable();
      platform.frame();
      await rest(END);
      await resize(600, 500);

      expect(platform.vibrations).toEqual([]);
    });

    it('stays still on the first rest, and beyond the phone', async () => {
      const { platform, sheet, lay } = await setup({ compact: false });
      await lay();

      sheet.toggle();

      expect(platform.vibrations).toEqual([]);
    });
  });

  describe('transient', () => {
    it('says it is dismissed, and does not rise, on a pull down from its lowest detent', async () => {
      const { fixture, scrollTo, drag } = await foldedSheet(true);
      scrollTo.mockClear();

      await drag([[0, 0]], 90);

      expect(fixture.componentInstance.dismissals).toBe(1);
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('stays where it was on a short pull, a pull up, or from another detent', async () => {
      const { fixture, drag, rest } = await foldedSheet(true);

      await drag([[0, 0]], 30);
      await drag([[0, 200]], -90);

      expect(fixture.componentInstance.dismissals).toBe(0);

      fixture.componentInstance.detent.set('half');
      fixture.detectChanges();
      await rest(HALF - PEEK);
      await drag([[HALF - PEEK, 300]], 90);

      expect(fixture.componentInstance.dismissals).toBe(0);
    });

    it('never says it is dismissed unless asked to be transient', async () => {
      const { fixture, drag } = await foldedSheet(false);

      await drag([[0, 0]], 90);

      expect(fixture.componentInstance.dismissals).toBe(0);
    });
  });

  describe('back', () => {
    it('lowers a full sheet to half on back, through the history where the browser has no close watcher', async () => {
      const { fixture, platform, host } = await risen(false);

      expect(platform.entries).toHaveLength(2);

      platform.pressBack();
      await fixture.whenStable();

      expect(host.dataset['detent']).toBe('half');
      expect(platform.place).toBe(0);
    });

    it('lowers a full sheet to half on back through a close watcher where the browser has one', async () => {
      const { fixture, platform, host } = await risen(true);

      expect(platform.entries).toHaveLength(1);

      platform.pressBack();
      await fixture.whenStable();

      expect(host.dataset['detent']).toBe('half');
    });

    it('lowers a full sheet to half when the router leaves, and leaves the next back alone, with or without a close watcher', async () => {
      for (const hasCloseWatcher of [true, false]) {
        TestBed.resetTestingModule();
        const { fixture, platform, host } = await risen(hasCloseWatcher);

        platform.leave();
        await fixture.whenStable();

        expect(host.dataset['detent']).toBe('half');

        const backs = platform.backs.length;
        platform.pressBack();
        await fixture.whenStable();

        expect(host.dataset['detent']).toBe('half');
        expect(platform.backs).toHaveLength(backs);
      }
    });

    it('leaves the back to the page once the sheet is not full, and takes its entry back', async () => {
      const { fixture, platform } = await risen(false);

      fixture.componentInstance.detent.set('half');
      await fixture.whenStable();

      expect(platform.backs).toEqual([1]);
    });
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

  it('drops a move toward a detent it is asked to leave before the next frame', async () => {
    const { fixture, platform, scrollTo, host } = await risen(false);
    scrollTo.mockClear();

    fixture.componentInstance.detent.set('half');
    await fixture.whenStable();
    fixture.componentInstance.detent.set('full');
    await fixture.whenStable();
    platform.frame();

    expect(scrollTo).not.toHaveBeenCalled();
    expect(host.dataset['detent']).toBe('full');
  });

  it('turns back toward the detent it rests on when asked for it again on the way to another', async () => {
    const { fixture, platform, scrollTo, rail } = await risen(false);

    fixture.componentInstance.detent.set('half');
    await fixture.whenStable();
    platform.frame();
    rail.scrollTop = END - 0.5;
    scrollTo.mockClear();
    fixture.componentInstance.detent.set('full');
    await fixture.whenStable();
    platform.frame();

    expect(scrollTo).toHaveBeenLastCalledWith({ top: END, behavior: 'smooth' });
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
