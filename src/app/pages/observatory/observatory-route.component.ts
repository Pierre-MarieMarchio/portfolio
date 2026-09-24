import { Component, effect, inject, input, untracked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ObservatoryView } from '@app/features/observatory/models';
import { ObservatoryManager } from '@app/features/observatory/states';

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
    const { snapshot } = inject(ActivatedRoute);
    const { view } = snapshot.data as ObservatoryRouteData;

    observatory.syncRoute(view, snapshot.paramMap.get('slug'));

    effect(() => {
      const slug = this.slug() ?? null;
      untracked(() => {
        if (observatory.view() !== view || observatory.slug() !== slug) {
          observatory.syncRoute(view, slug);
        }
      });
    });
  }
}
