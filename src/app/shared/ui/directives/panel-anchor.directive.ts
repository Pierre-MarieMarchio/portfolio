import {
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import {
  PanelRole,
  LayoutAnchorsService,
} from '../services/layout-anchors.service';

/**
 * Declares an element a panel of the object: text the matter dims behind
 * and keeps its labels off. The role, when there is one, is what the framing
 * reads of it (see `ObjectPanelRole`).
 *
 * `data-panel` stays on the element: the object's grab reads it to leave a
 * gesture on a panel to the panel.
 */
@Directive({
  selector: '[appPanelAnchor]',
  host: { '[attr.data-panel]': 'appPanelAnchor()' },
})
export class PanelAnchorDirective {
  public readonly appPanelAnchor = input<PanelRole>('');

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const leave = inject(LayoutAnchorsService).addPanel({
      element,
      role: () => this.appPanelAnchor(),
    });
    inject(DestroyRef).onDestroy(leave);
  }
}
