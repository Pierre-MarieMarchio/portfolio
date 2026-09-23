import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { BrowserEnvironment } from '@app/core/services';

/** The card plays for this long, then the page rises under it. */
const DURATION_MS = 5600;

/** Any of these says the reader has taken over: the card goes at once. */
const INTENT = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

/**
 * The opening card, once per visit, over everything. Nothing waits for it:
 * the content is in the document from the first frame, and the card fades
 * out on its own through CSS even without JavaScript. The script only takes
 * it away at the first gesture. Hidden entirely when the reader asked for
 * less motion.
 */
@Component({
  selector: 'app-intro-card',
  templateUrl: './intro-card.component.html',
  styleUrl: './intro-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntroCardComponent {
  protected readonly gone = signal(false);

  constructor() {
    const browser = inject(BrowserEnvironment);
    let stops: (() => void)[] = [];
    const leave = (): void => {
      stops.forEach((stop) => {
        stop();
      });
      stops = [];
      this.gone.set(true);
    };

    // Browser only: the prerender keeps the card, which fades by itself.
    // Checked here too, not left to `afterNextRender`, which decides where
    // it runs by other means than the platform the injector names.
    afterNextRender(() => {
      if (!browser.isBrowser) {
        return;
      }
      if (browser.prefersReducedMotion()) {
        leave();
        return;
      }
      const timer = setTimeout(leave, DURATION_MS);
      stops = [
        ...INTENT.map((type) => browser.listen(type, leave, { passive: true })),
        () => {
          clearTimeout(timer);
        },
      ];
    });
    inject(DestroyRef).onDestroy(() => {
      stops.forEach((stop) => {
        stop();
      });
    });
  }
}
