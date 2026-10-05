import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { BottomSheetDetent } from '../../models/bottom-sheet.model';
import { BottomSheetComponent } from './bottom-sheet.component';
import { BackLayersService } from '../../services/back-layers.service';
import { provideRouter, Router } from '@angular/router';
import {
  BrowserWindowService,
  ClockService,
  ElementObserverService,
  HapticsService,
  MediaPreferencesService,
  SessionHistoryService,
} from '@app/core/services';
import {
  BrowserWindowDouble,
  ClockDouble,
  ElementObserverDouble,
  HapticsDouble,
  MediaPreferencesDouble,
} from '@testing/doubles/browser-services.double';
import {
  MobileNavLayoutDouble,
  provideMobileNavLayout,
} from '@testing/doubles/mobile-nav-layout.double';
import { HistoryStackDouble } from '@testing/doubles/session-history.double';
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
class BottomSheetHost {
  public readonly detents = signal<readonly BottomSheetDetent[]>([
    'folded',
    'half',
    'full',
  ]);
  public readonly detent = signal<BottomSheetDetent>('half');
  public readonly transient = signal(false);
  public readonly changes: BottomSheetDetent[] = [];
  public dismissals = 0;

  public note(detent: BottomSheetDetent): void {
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
  const layout = new MobileNavLayoutDouble();
  const clock = new ClockDouble();
  const observer = new ElementObserverDouble();
  const media = new MediaPreferencesDouble();
  const haptics = new HapticsDouble();
  const browserWindow = new BrowserWindowDouble();
  const history = new HistoryStackDouble();
  layout.compact.set(compact);
  onPlatform(where);
  TestBed.configureTestingModule({
    imports: [BottomSheetHost],
    providers: [
      provideMobileNavLayout(layout),
      BackLayersService,
      provideRouter([{ path: '**', children: [] }]),
      { provide: ClockService, useValue: clock },
      { provide: ElementObserverService, useValue: observer },
      { provide: MediaPreferencesService, useValue: media },
      { provide: HapticsService, useValue: haptics },
      { provide: BrowserWindowService, useValue: browserWindow },
      { provide: SessionHistoryService, useValue: history },
    ],
  });
  const observed = vi.spyOn(observer, 'onResize');
  const fixture = TestBed.createComponent(BottomSheetHost);
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
  const bottomSheet = componentOf(fixture, BottomSheetComponent);
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
    clock,
    observer,
    media,
    haptics,
    browserWindow,
    history,
    leave: () => TestBed.inject(Router).navigateByUrl('/elsewhere'),
    observed,
    host,
    rail,
    bar,
    bottomSheet,
    scrollTo,
    changes: fixture.componentInstance.changes,
    top: () => top,
    lay: async (): Promise<void> => {
      bottomSheet.attachHandle(bar);
      observer.resize();
      clock.frame();
      await settle();
    },
    resize: async (height: number, content = END): Promise<void> => {
      room = height;
      end = content;
      observer.resize();
      clock.frame();
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

const foldedBottomSheet = async (isTransient: boolean) => {
  const setups = await setup();
  setups.fixture.componentInstance.transient.set(isTransient);
  await setups.lay();
  setups.bottomSheet.toggle();
  await setups.rest(0);
  return setups;
};

const risen = async (hasCloseWatcher: boolean) => {
  const setups = await setup();
  setups.history.hasWatcher = hasCloseWatcher;
  await setups.lay();
  setups.fixture.componentInstance.detent.set('full');
  await setups.fixture.whenStable();
  setups.clock.frame();
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
    expect(host.style.getPropertyValue('--mnav-bottom-sheet-peek')).toBe(
      '40px',
    );
    expect(host.style.getPropertyValue('--mnav-bottom-sheet-band')).toBe(
      '300px',
    );
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
    expect(host.style.getPropertyValue('--mnav-bottom-sheet-band')).toBe(
      '700px',
    );
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
    const { browserWindow, clock, changes, lay, drag, rest, fixture } =
      await setup();
    browserWindow.knowsScrollEnd = false;
    await lay();

    await drag([
      [260, 0],
      [300, 100],
      [340, 200],
    ]);
    await rest(END, ['scroll']);

    expect(changes).toEqual([]);

    clock.elapse(120);
    await fixture.whenStable();

    expect(changes).toEqual(['full']);
  });

  it('lowers to folded and back from its fold control, the detent said at the end of each scroll', async () => {
    const { bottomSheet, scrollTo, changes, lay, rest } = await setup();
    await lay();

    bottomSheet.toggle();

    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });
    expect(changes).toEqual([]);

    await rest(0);
    bottomSheet.toggle();

    expect(scrollTo).toHaveBeenLastCalledWith({
      top: HALF - PEEK,
      behavior: 'smooth',
    });

    await rest(HALF - PEEK);

    expect(changes).toEqual(['folded', 'half']);
  });

  it('goes and says so at once under reduced motion', async () => {
    const { media, bottomSheet, scrollTo, changes, lay, fixture } =
      await setup();
    media.isReduced = true;
    await lay();

    bottomSheet.toggle();
    await fixture.whenStable();

    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'instant' });
    expect(changes).toEqual(['folded']);
  });

  it('rises from a tap on its folded handle, but not from a button of it', async () => {
    const { bottomSheet, bar, scrollTo, lay, rest } = await setup();
    await lay();
    bottomSheet.toggle();
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
      const { haptics, lay, drag, rest } = await setup();
      await lay();

      await drag([
        [260, 0],
        [300, 100],
        [340, 200],
      ]);

      expect(haptics.vibrations).toEqual([]);

      await rest(END);

      expect(haptics.vibrations).toEqual([10]);
    });

    it('vibrates once its handle is tapped to another detent', async () => {
      const { haptics, bottomSheet, lay, rest } = await setup();
      await lay();

      bottomSheet.toggle();
      await rest(0);

      expect(haptics.vibrations).toEqual([10]);
    });

    it('vibrates when a reduced-motion drag or toggle is put there at once', async () => {
      const { haptics, media, bottomSheet, lay, fixture } = await setup();
      media.isReduced = true;
      await lay();

      bottomSheet.toggle();
      await fixture.whenStable();

      expect(haptics.vibrations).toEqual([10]);
    });

    it('stays still when a drag lets it rest where it was', async () => {
      const { haptics, lay, drag, rest } = await setup();
      await lay();

      await drag([
        [260, 0],
        [240, 100],
        [230, 200],
      ]);
      await rest(HALF - PEEK);

      expect(haptics.vibrations).toEqual([]);
    });

    it('stays still when the page sets the detent, and when it is resized', async () => {
      const { fixture, clock, haptics, lay, rest, resize } = await setup();
      await lay();

      fixture.componentInstance.detent.set('full');
      await fixture.whenStable();
      clock.frame();
      await rest(END);
      await resize(600, 500);

      expect(haptics.vibrations).toEqual([]);
    });

    it('stays still on the first rest, and beyond the phone', async () => {
      const { haptics, bottomSheet, lay } = await setup({ compact: false });
      await lay();

      bottomSheet.toggle();

      expect(haptics.vibrations).toEqual([]);
    });
  });

  describe('transient', () => {
    it('says it is dismissed, and does not rise, on a pull down from its lowest detent', async () => {
      const { fixture, scrollTo, drag } = await foldedBottomSheet(true);
      scrollTo.mockClear();

      await drag([[0, 0]], 90);

      expect(fixture.componentInstance.dismissals).toBe(1);
      expect(scrollTo).not.toHaveBeenCalled();
    });

    it('stays where it was on a short pull, a pull up, or from another detent', async () => {
      const { fixture, drag, rest } = await foldedBottomSheet(true);

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
      const { fixture, drag } = await foldedBottomSheet(false);

      await drag([[0, 0]], 90);

      expect(fixture.componentInstance.dismissals).toBe(0);
    });
  });

  describe('back', () => {
    it('lowers a full bottom sheet to half on back, through the history where the browser has no close watcher', async () => {
      const { fixture, history, host } = await risen(false);

      expect(history.entries).toHaveLength(2);

      history.pressBack();
      await fixture.whenStable();

      expect(host.dataset['detent']).toBe('half');
      expect(history.place).toBe(0);
    });

    it('lowers a full bottom sheet to half on back through a close watcher where the browser has one', async () => {
      const { fixture, history, host } = await risen(true);

      expect(history.entries).toHaveLength(1);

      history.pressBack();
      await fixture.whenStable();

      expect(host.dataset['detent']).toBe('half');
    });

    it.each([true, false])(
      'keeps its detent when the router leaves, and leaves the next back alone while it is hidden, with a close watcher: %s',
      async (hasCloseWatcher) => {
        const { fixture, history, leave, host } = await risen(hasCloseWatcher);

        await leave();
        await fixture.whenStable();

        expect(host.dataset['detent']).toBe('full');

        const backs = history.backs.length;
        history.pressBack();
        await fixture.whenStable();

        expect(host.dataset['detent']).toBe('full');
        expect(history.backs).toHaveLength(backs);
      },
    );

    it.each([true, false])(
      'takes a layer again when it is shown again at full after the router left, so that back lowers it first, with a close watcher: %s',
      async (hasCloseWatcher) => {
        const { fixture, history, leave, host, resize } =
          await risen(hasCloseWatcher);

        await leave();
        history.push({ navigationId: 2 });
        await resize(0);
        await resize(ROOM);
        await fixture.whenStable();

        expect(host.dataset['detent']).toBe('full');

        history.pressBack();
        await fixture.whenStable();

        expect(host.dataset['detent']).toBe('half');
      },
    );

    it.each([true, false])(
      'takes a layer again when it is seen again at full with no change of size, so that back lowers it first, with a close watcher: %s',
      async (hasCloseWatcher) => {
        const { fixture, history, observer, leave, host } =
          await risen(hasCloseWatcher);

        await leave();
        history.push({ navigationId: 2 });
        observer.sight(false);
        observer.sight(true);
        await fixture.whenStable();

        expect(host.dataset['detent']).toBe('full');

        history.pressBack();
        await fixture.whenStable();

        expect(host.dataset['detent']).toBe('half');
      },
    );

    it.each([true, false])(
      'takes no layer while it is out of sight, with a close watcher: %s',
      async (hasCloseWatcher) => {
        const { fixture, history, observer, leave, host } =
          await risen(hasCloseWatcher);

        await leave();
        observer.sight(false);
        await fixture.whenStable();

        const backs = history.backs.length;
        history.pressBack();
        await fixture.whenStable();

        expect(host.dataset['detent']).toBe('full');
        expect(history.backs).toHaveLength(backs);
      },
    );

    it('leaves the back to the page once the bottom sheet is not full, and takes its entry back', async () => {
      const { fixture, history } = await risen(false);

      fixture.componentInstance.detent.set('half');
      await fixture.whenStable();

      expect(history.backs).toEqual([1]);
    });
  });

  it('goes after the next frame to a detent set from outside', async () => {
    const { fixture, clock, scrollTo, host, lay, rest } = await setup();
    await lay();

    fixture.componentInstance.detent.set('full');
    await fixture.whenStable();

    expect(scrollTo).not.toHaveBeenLastCalledWith({
      top: END,
      behavior: 'smooth',
    });

    clock.frame();

    expect(scrollTo).toHaveBeenLastCalledWith({ top: END, behavior: 'smooth' });

    await rest(END);

    expect(host.dataset['detent']).toBe('full');
  });

  it('drops a move toward a detent it is asked to leave before the next frame', async () => {
    const { fixture, clock, scrollTo, host } = await risen(false);
    scrollTo.mockClear();

    fixture.componentInstance.detent.set('half');
    await fixture.whenStable();
    fixture.componentInstance.detent.set('full');
    await fixture.whenStable();
    clock.frame();

    expect(scrollTo).not.toHaveBeenCalled();
    expect(host.dataset['detent']).toBe('full');
  });

  it('turns back toward the detent it rests on when asked for it again on the way to another', async () => {
    const { fixture, clock, scrollTo, rail } = await risen(false);

    fixture.componentInstance.detent.set('half');
    await fixture.whenStable();
    clock.frame();
    rail.scrollTop = END - 0.5;
    scrollTo.mockClear();
    fixture.componentInstance.detent.set('full');
    await fixture.whenStable();
    clock.frame();

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

  it('shades the sky it leaves only between half and full, and never for a bottom sheet without both', async () => {
    const { fixture, host, lay, resize } = await setup();
    await lay();

    expect(host.dataset['rising']).toBe('');
    expect(host.style.getPropertyValue('--mnav-bottom-sheet-shade-from')).toBe(
      '260px',
    );

    fixture.componentInstance.detents.set(['folded', 'half']);
    await fixture.whenStable();
    await resize(ROOM);

    expect(host.dataset['rising']).toBeUndefined();
  });

  it('keeps out of the way beyond the phone: no scroll, and its fold is left to the window', async () => {
    const { host, bottomSheet, scrollTo, lay } = await setup({
      compact: false,
    });
    await lay();

    bottomSheet.toggle();

    expect(host.dataset['active']).toBeUndefined();
    expect(scrollTo).not.toHaveBeenCalled();
    expect(host.dataset['detent']).toBe('half');
  });

  it('is inert on the server: it observes nothing and scrolls nothing', async () => {
    const { host, observed, scrollTo, clock, observer } = await setup({
      platform: 'server',
    });

    observer.resize();
    clock.frame();

    expect(observed).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();
    expect(host.dataset['detent']).toBe('half');
  });
});
