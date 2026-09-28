import {
  afterNextRender,
  DestroyRef,
  effect,
  inject,
  linkedSignal,
  Service,
  untracked,
} from '@angular/core';
import { ObservatoryManager } from '@app/features/observatory/states';
import { ViewFocusService } from '@shared/ui/services';
import { WindowStackService } from '@shared/windows/services';
import type { ViewSlot } from '../models/observatory.model';
import { windowOf } from '../rules/view.rules';

@Service({ autoProvided: false })
export class ViewWindowsService {
  private readonly observatory = inject(ObservatoryManager);
  private readonly stack = inject(WindowStackService);
  private readonly viewFocus = inject(ViewFocusService);
  private readonly slots = new Map<ViewSlot, HTMLElement>();
  private isLanded = false;

  constructor() {
    this.bringViewWindowToFront();
    this.focusAfterNavigations();
    afterNextRender(() => {
      this.isLanded = true;
    });
  }

  public add(slot: ViewSlot, element: HTMLElement): () => void {
    this.slots.set(slot, element);
    return () => {
      if (this.slots.get(slot) === element) {
        this.slots.delete(slot);
      }
    };
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
      const shown = windowOf(this.observatory.view()) ?? 'home';
      this.observatory.slug();
      untracked(() => {
        withdraw?.();
        withdraw = this.isLanded
          ? this.viewFocus.claimWithin(() => this.slots.get(shown))
          : undefined;
      });
    });
    inject(DestroyRef).onDestroy(() => {
      withdraw?.();
    });
  }
}
