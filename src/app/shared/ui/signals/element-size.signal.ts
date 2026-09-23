import {
  afterNextRender,
  DestroyRef,
  inject,
  Signal,
  signal,
} from '@angular/core';
import { ElementObserverService } from '@app/core/services';
import { ElementSize } from '../models/element-size.model';

export function elementSize(
  el: () => Element | undefined,
): Signal<ElementSize | null> {
  const observer = inject(ElementObserverService);
  const size = signal<ElementSize | null>(null);
  let stop: (() => void) | undefined;
  afterNextRender(() => {
    const target = el();
    if (!target) {
      return;
    }
    const measure = (): void => {
      const { width, height } = target.getBoundingClientRect();
      size.set({ width, height });
    };
    measure();
    stop = observer.onResize(target, measure);
  });
  inject(DestroyRef).onDestroy(() => {
    stop?.();
  });
  return size.asReadonly();
}
