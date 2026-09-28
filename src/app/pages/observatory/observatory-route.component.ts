import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClockService } from '@app/core/services';
import { ObservatoryView } from '@app/features/observatory/models';
import { ObservatoryManager } from '@app/features/observatory/states';

const ignore = (): void => {};

export interface ObservatoryRouteData {
  readonly view: ObservatoryView;
}

@Component({
  selector: 'app-observatory-route',
  template: '',
})
export class ObservatoryRouteComponent {
  public readonly slug = input<string | null>(null);

  constructor() {
    const observatory = inject(ObservatoryManager);
    const router = inject(Router);
    const clock = inject(ClockService);
    const { snapshot } = inject(ActivatedRoute);
    const { view } = snapshot.data as ObservatoryRouteData;
    let stop = ignore;

    const declare = (slug: string | null): void => {
      if (observatory.view() !== view || observatory.slug() !== slug) {
        observatory.syncRoute(view, slug);
      }
    };
    const declareSoon = (slug: string | null): void => {
      stop();
      if (router.navigated) {
        stop = clock.nextFrame(() => {
          declare(slug);
        });
      } else {
        declare(slug);
      }
    };

    declareSoon(snapshot.paramMap.get('slug'));

    effect(() => {
      const slug = this.slug() ?? null;
      untracked(() => {
        declareSoon(slug);
      });
    });
    inject(DestroyRef).onDestroy(() => {
      stop();
    });
  }
}
