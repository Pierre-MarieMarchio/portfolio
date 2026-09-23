import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
} from '@angular/core';
import { ViewFocusService } from '../services/view-focus.service';

@Directive({ selector: '[appViewHeading]' })
export class ViewHeadingDirective {
  constructor() {
    const heading = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const focus = inject(ViewFocusService);
    let leave: (() => void) | undefined;
    afterNextRender(() => {
      leave = focus.add(heading);
    });
    inject(DestroyRef).onDestroy(() => {
      leave?.();
    });
  }
}
