import { Directive, effect, ElementRef, inject, input } from '@angular/core';
import { LayoutAnchorsService } from '../services/layout-anchors.service';

@Directive({
  selector: '[appLayoutAnchor]',
  host: { '[attr.data-panel]': 'appLayoutAnchor()' },
})
export class LayoutAnchorDirective {
  public readonly appLayoutAnchor = input.required<string>();

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const anchors = inject(LayoutAnchorsService);
    effect((onCleanup) => {
      onCleanup(anchors.register(el, this.appLayoutAnchor()));
    });
  }
}
