import {
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { ObjectPanelRole, ObjectRegistry } from './object-registry.service';

/**
 * Declares an element a panel of the object: text the matter dims behind
 * and keeps its labels off. The role, when there is one, is what the framing
 * reads of it (see `ObjectPanelRole`).
 *
 * `data-panel` stays on the element: the object's grab reads it to leave a
 * gesture on a panel to the panel.
 */
@Directive({
  selector: '[appObjectPanel]',
  host: { '[attr.data-panel]': 'appObjectPanel()' },
})
export class ObjectPanelDirective {
  public readonly appObjectPanel = input<ObjectPanelRole>('');

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const leave = inject(ObjectRegistry).addPanel({
      element,
      role: () => this.appObjectPanel(),
    });
    inject(DestroyRef).onDestroy(leave);
  }
}
