import { Directive, effect, ElementRef, inject, input } from '@angular/core';
import { LayoutAnchorsService } from '../services/layout-anchors.service';

@Directive({
  selector: '[appLayoutAnchor]',
  host: { '[attr.data-panel]': 'appLayoutAnchor()' },
})
export class LayoutAnchorDirective {
  public readonly appLayoutAnchor = input.required<string | null>();

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const anchors = inject(LayoutAnchorsService);
    effect((onCleanup) => {
      const kind = this.appLayoutAnchor();
      if (kind !== null) {
        onCleanup(anchors.register(el, kind));
      }
    });
  }
}
