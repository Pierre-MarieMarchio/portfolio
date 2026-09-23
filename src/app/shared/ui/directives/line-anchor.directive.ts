import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';
import { LayoutAnchorsService } from '../services/layout-anchors.service';

/**
 * Declares an element a line of the home rule: it rises with its planet, on
 * the object's clock. The lines are read in document order, which is the
 * rule's rank order.
 */
@Directive({
  selector: '[appLineAnchor]',
  host: { 'data-object-line': '' },
})
export class LineAnchorDirective {
  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const leave = inject(LayoutAnchorsService).addLine(element);
    inject(DestroyRef).onDestroy(leave);
  }
}
