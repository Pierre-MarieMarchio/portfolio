import { Directive, inject, input } from '@angular/core';
import {
  WindowSlot,
  WindowStackService,
} from '../services/window-stack.service';

/**
 * A place a window is shown in: it names itself for the stack, and takes the
 * rank the stack gives it.
 */
@Directive({
  selector: '[appWindowSlot]',
  host: {
    '[attr.data-slot]': 'appWindowSlot()',
    '[style.--stack]': 'stack.rankOf(appWindowSlot())',
  },
})
export class WindowSlotDirective {
  protected readonly stack = inject(WindowStackService);

  public readonly appWindowSlot = input.required<WindowSlot>();
}
