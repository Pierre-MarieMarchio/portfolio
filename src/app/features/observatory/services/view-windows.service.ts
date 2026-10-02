import {
  afterNextRender,
  DestroyRef,
  effect,
  inject,
  linkedSignal,
  Service,
  Signal,
  untracked,
} from '@angular/core';
import {
  ClockService,
  DisplayFormatService,
  MediaPreferencesService,
} from '@app/core/services';
import { ObservatoryManager } from '@app/features/observatory/states';
import { ViewFocusService } from '@shared/ui/services';
import { WindowStackService } from '@shared/windows/services';
import type { ObservatoryWindow, ViewSlot } from '../models/observatory.model';
import { windowOf } from '../rules/view.rules';

interface ShownSlot {
  readonly element: HTMLElement;
  readonly isShown: Signal<boolean> | undefined;
}

const PREPARED: readonly ObservatoryWindow[] = ['index', 'about'];

@Service({ autoProvided: false })
export class ViewWindowsService {
  private readonly observatory = inject(ObservatoryManager);
  private readonly stack = inject(WindowStackService);
  private readonly viewFocus = inject(ViewFocusService);
  private readonly clock = inject(ClockService);
  private readonly display = inject(DisplayFormatService);
  private readonly media = inject(MediaPreferencesService);
  private readonly slots = new Map<ViewSlot, ShownSlot>();
  private isLanded = false;
  private stopPreparing: (() => void) | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.stopPreparing?.();
    });
    this.bringViewWindowToFront();
    this.focusAfterNavigations();
    afterNextRender(() => {
      this.isLanded = true;
    });
  }

  public add(
    slot: ViewSlot,
    element: HTMLElement,
    isShown?: Signal<boolean>,
  ): () => void {
    const shown = { element, isShown };
    this.slots.set(slot, shown);
    return () => {
      if (this.slots.get(slot) === shown) {
        this.slots.delete(slot);
      }
    };
  }

  public bringToFront(window: ObservatoryWindow): void {
    this.stack.bringToFront(window);
  }

  public scrollToTop(window: ObservatoryWindow | null): boolean {
    const behavior = this.media.reducedMotion() ? 'instant' : 'smooth';
    let isScrolled = false;
    const content = window ? this.slots.get(window)?.element : undefined;
    for (const element of content?.querySelectorAll<HTMLElement>(
      'app-window *',
    ) ?? []) {
      if (element.scrollTop > 0) {
        element.scrollTo({ top: 0, behavior });
        isScrolled = true;
      }
    }
    return isScrolled;
  }

  public prepareWhenIdle(): void {
    if (this.stopPreparing) {
      return;
    }
    const next = (windows: readonly ObservatoryWindow[]): void => {
      const [window, ...rest] = windows;
      this.stopPreparing = window
        ? this.clock.whenIdle(() => {
            this.observatory.prepare(window);
            next(rest);
          })
        : () => {};
    };
    next(PREPARED);
  }

  private bringViewWindowToFront(): void {
    const front = linkedSignal({
      source: () => ({
        view: this.observatory.view(),
        slug: this.observatory.slug(),
      }),
      computation: ({ view }) => windowOf(view),
      equal: () => false,
    });
    effect(() => {
      const shown = front();
      if (shown) {
        untracked(() => {
          this.stack.bringToFront(shown);
        });
      }
    });
  }

  private focusAfterNavigations(): void {
    let withdraw: (() => void) | undefined;
    effect(() => {
      const view = this.observatory.view();
      const hasPreviewWindow = this.display.format() !== 'phone';
      const preview =
        view === 'home' && hasPreviewWindow
          ? this.observatory.preview()
          : untracked(() => this.observatory.preview());
      const shown: ViewSlot =
        view === 'home' && hasPreviewWindow && preview !== null
          ? 'preview'
          : (windowOf(view) ?? 'home');
      this.observatory.slug();
      const slot = untracked(() => this.slots.get(shown));
      const isReady = slot?.isShown?.() ?? true;
      untracked(() => {
        withdraw?.();
        withdraw =
          this.isLanded && isReady
            ? this.viewFocus.claimWithin(() => this.slots.get(shown)?.element)
            : undefined;
      });
    });
    inject(DestroyRef).onDestroy(() => {
      withdraw?.();
    });
  }
}
