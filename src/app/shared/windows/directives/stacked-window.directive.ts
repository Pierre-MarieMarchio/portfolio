import { computed, Directive, effect, inject, input } from '@angular/core';
import { WindowStackService } from '../services/window-stack.service';

@Directive({
  selector: '[appStackedWindow]',
  host: {
    '[style.--stack]': 'depth()',
    '(pointerdown)': 'bringToFront()',
  },
})
export class StackedWindowDirective {
  private readonly stack = inject(WindowStackService);

  public readonly appStackedWindow = input.required<string>();

  protected readonly depth = computed(() =>
    this.stack.depthOf(this.appStackedWindow()),
  );

  constructor() {
    effect((onCleanup) => {
      onCleanup(this.stack.register(this.appStackedWindow()));
    });
  }

  protected bringToFront(): void {
    this.stack.bringToFront(this.appStackedWindow());
  }
}
