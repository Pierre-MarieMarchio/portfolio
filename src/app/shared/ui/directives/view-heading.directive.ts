import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
} from '@angular/core';
import { ViewFocusService } from '../services/view-focus.service';

/**
 * The heading a view's focus lands on when the reader arrives on it. It
 * signs in once rendered, so it is in its container by then; and only in a
 * browser, where there is a focus to move.
 */
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
