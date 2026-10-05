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
import { ClockService, MediaPreferencesService } from '@app/core/services';
import type { SwipeHost, SwipeStops } from '../models/swipe.model';
import type { SwipeStepsService } from '../services/swipe-steps.service';
import { MOBILE_NAV_LAYOUT } from '../ports/mobile-nav-layout.port';

export const loadSwipeSteps = (): Promise<typeof SwipeStepsService> =>
  import('../services/swipe-steps.service').then(
    (service) => service.SwipeStepsService,
  );

@Directive({ selector: '[appSwipeSteps]' })
export class SwipeStepsDirective implements SwipeHost {
  public readonly layout = inject(MOBILE_NAV_LAYOUT);
  public readonly media = inject(MediaPreferencesService);
  public readonly clock = inject(ClockService);
  private readonly injector = inject(Injector);
  public readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  public readonly appSwipeSteps = input.required<SwipeStops>();

  public readonly stepped = output<number>();

  constructor() {
    afterNextRender(() => {
      if (this.layout.isCompact()) {
        void loadSwipeSteps().then((create) => {
          this.injector.get(DestroyRef).onDestroy(new create(this).stop);
        });
      }
    });
  }

  public readonly afterRender = (callback: () => void): (() => void) => {
    const ref = afterNextRender(callback, { injector: this.injector });
    return () => {
      ref.destroy();
    };
  };
}
