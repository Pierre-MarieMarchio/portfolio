import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { BrowserEnvironmentService } from '@app/core/services';

/** The four places a window is shown in. */
export type WindowSlot = 'about' | 'index' | 'sheet' | 'preview';

const SLOTS: readonly WindowSlot[] = ['about', 'index', 'sheet', 'preview'];

const SLOT_NAMES: ReadonlySet<string | undefined> = new Set(SLOTS);

const isSlot = (name: string | undefined): name is WindowSlot =>
  SLOT_NAMES.has(name);

/**
 * The windows' depth: the last one touched, by the pointer or by arriving on
 * its view, in front of the others. Its order is a signal read by each slot
 * (`appWindowSlot`) as a `--stack` rank above `--z-window`, so the depth
 * tier is written once, in the tokens.
 *
 * Nothing is written until a window is first touched: until then each slot
 * keeps its default rank from the stylesheet (the preview above the sheet,
 * the sheet above the rest), as the prerender draws it.
 *
 * Provided by the station, which it listens for: a pointerdown anywhere in a
 * slot raises it, in the capture phase, before the window's own handlers.
 */
@Injectable()
export class WindowStackService {
  private readonly order = signal<readonly WindowSlot[] | null>(null);

  constructor() {
    const stop = inject(BrowserEnvironmentService).listen(
      'pointerdown',
      (event) => {
        const slot =
          event.target instanceof Element
            ? event.target.closest<HTMLElement>('[data-slot]')?.dataset['slot']
            : undefined;
        if (isSlot(slot)) {
          this.bringToFront(slot);
        }
      },
      { capture: true },
    );
    inject(DestroyRef).onDestroy(stop);
  }

  public bringToFront(slot: WindowSlot): void {
    const order = this.order() ?? SLOTS;
    if (order.at(-1) === slot) {
      return;
    }
    this.order.set([...order.filter((each) => each !== slot), slot]);
  }

  /** The slot's rank from the back, or `null` while nothing was touched. */
  public rankOf(slot: WindowSlot): number | null {
    return this.order()?.indexOf(slot) ?? null;
  }
}
