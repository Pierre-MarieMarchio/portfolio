import {
  afterNextRender,
  contentChild,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
} from '@angular/core';
import { BrowserEnvironmentService } from '@app/core/services';
import { PageBarComponent } from '@shared/ui/components';

/**
 * Writes on the scene how far down the page bar reaches, as
 * `--head-bottom`. The name and the pages can take two lines (a phone,
 * enlarged text): the windows start under the bar's real height, never
 * under a guessed one, or a window covers its buttons.
 *
 * A CSS variable, so measuring schedules no render; browser only, where
 * there is a layout to measure, and again whenever the bar changes size.
 */
@Directive({ selector: '[appHeadBottom]' })
export class HeadBottomDirective {
  private readonly bar = contentChild.required<
    PageBarComponent,
    ElementRef<HTMLElement>
  >(PageBarComponent, { read: ElementRef });

  constructor() {
    const browser = inject(BrowserEnvironmentService);
    const scene = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    let stop: (() => void) | undefined;
    afterNextRender(() => {
      const head = this.bar().nativeElement;
      const measure = (): void => {
        const bottom =
          head.getBoundingClientRect().bottom -
          scene.getBoundingClientRect().top;
        scene.style.setProperty(
          '--head-bottom',
          `${String(Math.round(bottom))}px`,
        );
      };
      measure();
      stop = browser.observeResize(head, measure);
    });
    inject(DestroyRef).onDestroy(() => {
      stop?.();
    });
  }
}
