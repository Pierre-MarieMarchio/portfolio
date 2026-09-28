import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { ClockService } from '@app/core/services';

@Directive({
  selector: '[appKeptWindow]',
  host: {
    '[attr.data-shown]': 'isShown()',
    '[attr.inert]': 'isShown() ? null : ""',
    '[style.content-visibility]': 'isShown() ? null : "hidden"',
  },
})
export class KeptWindowDirective {
  private readonly clock = inject(ClockService);
  private readonly isDue = signal(true);
  private stopWaiting: () => void = () => {};

  public readonly shown = input(true);

  public readonly isShown = computed(() => this.shown() && this.isDue());

  constructor() {
    let isLanded = false;
    afterNextRender(() => {
      isLanded = true;
    });
    effect(() => {
      const isAsked = this.shown();
      untracked(() => {
        this.stopWaiting();
        if (isAsked && isLanded) {
          this.waitForAFrame();
        }
      });
    });
    inject(DestroyRef).onDestroy(() => {
      this.stopWaiting();
    });
  }

  private waitForAFrame(): void {
    this.isDue.set(false);
    this.stopWaiting = this.clock.nextFrame(() => {
      this.stopWaiting = this.clock.nextFrame(() => {
        this.isDue.set(true);
      });
    });
  }
}
