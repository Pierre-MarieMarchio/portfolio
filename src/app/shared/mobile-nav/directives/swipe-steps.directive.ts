import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  Injector,
  input,
  output,
} from '@angular/core';
import type { SwipeHost, SwipeStops } from '../models/swipe.model';
import type { SwipeStepsService } from '../services/swipe-steps.service';
import { MOBILE_NAV_PLATFORM } from '../ports/mobile-nav-platform.port';

export const loadSwipeSteps = (): Promise<typeof SwipeStepsService> =>
  import('../services/swipe-steps.service').then(
    (service) => service.SwipeStepsService,
  );

@Directive({ selector: '[appSwipeSteps]' })
export class SwipeStepsDirective implements SwipeHost {
  public readonly platform = inject(MOBILE_NAV_PLATFORM);
  private readonly injector = inject(Injector);
  public readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  public readonly appSwipeSteps = input.required<SwipeStops>();

  public readonly stepped = output<number>();

  constructor() {
    afterNextRender(() => {
      if (this.platform.isCompact()) {
        void loadSwipeSteps().then((create) => {
          this.injector.get(DestroyRef).onDestroy(new create(this).stop);
        });
      }
    });
  }

  public readonly afterRender = (fn: () => void): (() => void) => {
    const ref = afterNextRender(fn, { injector: this.injector });
    return () => {
      ref.destroy();
    };
  };
}
