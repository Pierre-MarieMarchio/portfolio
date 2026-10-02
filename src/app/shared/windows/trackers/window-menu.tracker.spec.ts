import type { WindowMenuHost } from '../models/window-menu.model';
import type { WindowTexts } from '../ports/window-texts.port';
import { WindowMenuTracker } from './window-menu.tracker';

const TEXTS: WindowTexts = {
  menu: 'Menu de la fenêtre',
  keepOpen: 'Garder ouverte en changeant de page',
  keptOpen: 'gardée ouverte',
  snapLeft: 'Moitié gauche',
  snapRight: 'Moitié droite',
  maximize: 'Agrandir la fenêtre',
  restore: 'Remettre la fenêtre à sa taille',
  close: 'Fermer la fenêtre',
  phone: {
    fold: 'Baisser la fenêtre',
    unfold: 'Remonter la fenêtre',
  },
};

const press = (target: Element, key: string): void => {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
  );
};

class HostDouble implements WindowMenuHost {
  public readonly button = document.createElement('button');
  public isPinned = false;
  public isMaximizable = true;
  public mode: 'full' | null = null;
  public readonly snaps: ('left' | 'right')[] = [];
  public maximizes = 0;
  public pins = 0;
  public windowListeners: ((event: PointerEvent) => void)[] = [];

  constructor() {
    document.body.append(this.button);
  }

  public texts(): WindowTexts {
    return TEXTS;
  }

  public pinned(): boolean {
    return this.isPinned;
  }

  public maximizable(): boolean {
    return this.isMaximizable;
  }

  public frameMode(): 'full' | null {
    return this.mode;
  }

  public viewport(): { width: number; height: number } {
    return { width: 800, height: 600 };
  }

  public onWindow(
    _type: 'pointerdown',
    handler: (event: PointerEvent) => void,
  ): () => void {
    this.windowListeners.push(handler);
    return () => {
      this.windowListeners = this.windowListeners.filter((h) => h !== handler);
    };
  }

  public emitPin(): void {
    this.pins += 1;
  }

  public snapTo(zone: 'left' | 'right'): void {
    this.snaps.push(zone);
  }

  public toggleMaximize(): void {
    this.maximizes += 1;
  }
}

const panelOf = (): HTMLElement | null =>
  document.querySelector('[role="menu"]');

const itemsOf = (): HTMLButtonElement[] => [
  ...document.querySelectorAll<HTMLButtonElement>('[role="menu"] button'),
];

describe('WindowMenuTracker', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('opens the menu with an item for pin, each half and maximize, and focuses the first', () => {
    const host = new HostDouble();
    const tracker = new WindowMenuTracker(host);

    tracker.open();

    const items = itemsOf();
    expect(items.map((item) => item.textContent?.trim())).toEqual([
      TEXTS.keepOpen,
      TEXTS.snapLeft,
      TEXTS.snapRight,
      TEXTS.maximize,
    ]);
    expect(document.activeElement).toBe(items[0]);
    expect(host.button.getAttribute('aria-expanded')).toBe('true');
    expect(host.button.getAttribute('aria-controls')).toBe(panelOf()?.id);
  });

  it('offers no maximize item when the window cannot maximize', () => {
    const host = new HostDouble();
    host.isMaximizable = false;
    new WindowMenuTracker(host).open();

    expect(itemsOf().map((item) => item.textContent?.trim())).not.toContain(
      TEXTS.maximize,
    );
  });

  it('checks the pin item on the pinned state', () => {
    const host = new HostDouble();
    host.isPinned = true;
    new WindowMenuTracker(host).open();

    expect(itemsOf()[0]?.getAttribute('aria-checked')).toBe('true');
  });

  it('closes on a second open call being a no-op, and reopens cleanly', () => {
    const host = new HostDouble();
    const tracker = new WindowMenuTracker(host);
    tracker.open();
    tracker.open();

    expect(document.querySelectorAll('[role="menu"]')).toHaveLength(1);

    tracker.close(false);
    expect(panelOf()).toBeNull();
    expect(host.button.getAttribute('aria-expanded')).toBe('false');
    expect(host.button.hasAttribute('aria-controls')).toBe(false);
  });

  it('circulates with the arrows, and jumps to the ends with Home and End', () => {
    const host = new HostDouble();
    new WindowMenuTracker(host).open();
    const items = itemsOf();

    press(document.activeElement as Element, 'ArrowDown');
    expect(document.activeElement).toBe(items[1]);

    press(document.activeElement as Element, 'ArrowUp');
    expect(document.activeElement).toBe(items[0]);

    press(document.activeElement as Element, 'ArrowUp');
    expect(document.activeElement).toBe(items.at(-1));

    press(document.activeElement as Element, 'Home');
    expect(document.activeElement).toBe(items[0]);

    press(document.activeElement as Element, 'End');
    expect(document.activeElement).toBe(items.at(-1));
  });

  it('closes on Escape without letting it bubble, and returns focus to the button', () => {
    const heard = vi.fn();
    document.addEventListener('keydown', heard);
    const host = new HostDouble();
    new WindowMenuTracker(host).open();

    const wasNotPrevented = (document.activeElement as Element).dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(panelOf()).toBeNull();
    expect(document.activeElement).toBe(host.button);
    expect(wasNotPrevented).toBe(false);
    expect(heard).not.toHaveBeenCalled();
    document.removeEventListener('keydown', heard);
  });

  it('closes on Tab, and returns focus to the button', () => {
    const host = new HostDouble();
    new WindowMenuTracker(host).open();

    press(document.activeElement as Element, 'Tab');

    expect(panelOf()).toBeNull();
    expect(document.activeElement).toBe(host.button);
  });

  it('closes on an outside pointerdown, without forcing focus back', () => {
    const host = new HostDouble();
    new WindowMenuTracker(host).open();

    for (const handler of host.windowListeners) {
      handler({ target: document.body } as unknown as PointerEvent);
    }

    expect(panelOf()).toBeNull();
  });

  it('keeps open on a pointerdown inside the panel', () => {
    const host = new HostDouble();
    new WindowMenuTracker(host).open();
    const item = itemsOf()[0];

    for (const handler of host.windowListeners) {
      handler({ target: item } as unknown as PointerEvent);
    }

    expect(panelOf()).not.toBeNull();
  });

  it('emits pin, snaps left or right, and toggles maximize, then closes', () => {
    const host = new HostDouble();
    const tracker = new WindowMenuTracker(host);

    tracker.open();
    itemsOf()[0]?.click();
    expect(host.pins).toBe(1);
    expect(panelOf()).toBeNull();

    tracker.open();
    itemsOf()[1]?.click();
    expect(host.snaps).toEqual(['left']);

    tracker.open();
    itemsOf()[2]?.click();
    expect(host.snaps).toEqual(['left', 'right']);

    tracker.open();
    itemsOf()[3]?.click();
    expect(host.maximizes).toBe(1);
  });

  it('names the maximize item by the current frame mode', () => {
    const host = new HostDouble();
    host.mode = 'full';
    new WindowMenuTracker(host).open();

    expect(itemsOf().at(-1)?.textContent?.trim()).toBe(TEXTS.restore);
  });

  it('positions the panel from the button, clamped to the screen', () => {
    const original: (this: HTMLElement) => DOMRect = Reflect.get(
      HTMLElement.prototype,
      'getBoundingClientRect',
    );
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      if (this.tagName === 'BUTTON' && !this.closest('[role="menu"]')) {
        return new DOMRect(780, 580, 24, 32);
      }
      return this.getAttribute('role') === 'menu'
        ? new DOMRect(0, 0, 220, 160)
        : original.call(this);
    };
    const host = new HostDouble();
    new WindowMenuTracker(host).open();
    HTMLElement.prototype.getBoundingClientRect = original;

    const panel = panelOf() as HTMLElement;
    expect(Number.parseFloat(panel.style.left)).toBeLessThanOrEqual(800 - 220);
    expect(Number.parseFloat(panel.style.top)).toBeLessThanOrEqual(600 - 160);
  });

  it('stops cleanly, closing an open menu', () => {
    const host = new HostDouble();
    const tracker = new WindowMenuTracker(host);
    tracker.open();

    tracker.stop();

    expect(panelOf()).toBeNull();
  });
});
