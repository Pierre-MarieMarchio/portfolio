import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { BrowserEnvironmentService } from '@app/core/services';
import { DESKTOP_TEXTS } from '../../ports/desktop-texts.port';

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
  protected readonly texts = inject(DESKTOP_TEXTS);

  constructor() {
    const browser = inject(BrowserEnvironmentService);
    let stop: (() => void) | undefined;
    const leave = (): void => {
      this.gone.set(true);
    };

    // Browser only: the prerender keeps the card, which fades by itself.
    // Checked here too, not left to `afterNextRender`, which decides where
    // it runs by other means than the platform the injector names. The
    // card's length is the CSS's (`--intro-duration`), read, not copied.
    afterNextRender(() => {
      if (!browser.isBrowser) {
        return;
      }
      const duration = browser.rootDuration('--intro-duration');
      if (browser.prefersReducedMotion() || duration === null) {
        leave();
        return;
      }
      stop = browser.firstGesture(duration, leave);
    });
    inject(DestroyRef).onDestroy(() => {
      stop?.();
    });
  }
}
