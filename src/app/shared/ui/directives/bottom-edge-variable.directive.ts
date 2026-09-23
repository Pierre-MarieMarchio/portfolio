import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { ElementObserverService } from '@app/core/services';

@Directive({ selector: '[appBottomEdgeVariable]' })
export class BottomEdgeVariableDirective {
  public readonly appBottomEdgeVariable = input.required<string>();

  constructor() {
    const observer = inject(ElementObserverService);
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    let stop: (() => void) | undefined;
    afterNextRender(() => {
      const container = el.parentElement;
      if (!container) {
        return;
      }
      const measure = (): void => {
        const bottom =
          el.getBoundingClientRect().bottom -
          container.getBoundingClientRect().top;
        container.style.setProperty(
          this.appBottomEdgeVariable(),
          `${String(Math.round(bottom))}px`,
        );
      };
      measure();
      stop = observer.onResize(el, measure);
    });
    inject(DestroyRef).onDestroy(() => {
      stop?.();
    });
  }
}
