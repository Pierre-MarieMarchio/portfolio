import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';
import { ObjectRegistry } from './object-registry.service';

/**
 * Declares an element a line of the home rule: it rises with its planet, on
 * the object's clock. The lines are read in document order, which is the
 * rule's rank order.
 */
@Directive({
  selector: '[appObjectLine]',
  host: { 'data-object-line': '' },
})
export class ObjectLineDirective {
  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const leave = inject(ObjectRegistry).addLine(element);
    inject(DestroyRef).onDestroy(leave);
  }
}
