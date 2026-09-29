import {
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { WindowStackService } from '../services/window-stack.service';

@Directive({
  selector: '[appStackedWindow]',
  host: {
    '[style.--stack]': 'depth()',
    '(pointerdown)': 'bringToFront()',
    '(focusin)': 'bringToFront()',
  },
})
export class StackedWindowDirective {
  private readonly stack = inject(WindowStackService);
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  public readonly appStackedWindow = input.required<string>();

  protected readonly depth = computed(() =>
    this.stack.depthOf(this.appStackedWindow()),
  );

  constructor() {
    effect((onCleanup) => {
      onCleanup(this.stack.register(this.appStackedWindow(), this.element));
    });
  }

  protected bringToFront(): void {
    this.stack.bringToFront(this.appStackedWindow());
  }
}
