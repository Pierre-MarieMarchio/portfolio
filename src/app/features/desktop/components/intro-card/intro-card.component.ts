import {
  afterNextRender,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { DocumentStylesService, UserPresenceService } from '@app/core/services';
import { DESKTOP_TEXTS } from '../../ports/desktop-texts.port';

@Component({
  selector: 'app-intro-card',
  templateUrl: './intro-card.component.html',
  styleUrl: './intro-card.component.scss',
})
export class IntroCardComponent {
  protected readonly gone = signal(false);
  protected readonly texts = inject(DESKTOP_TEXTS);

  constructor() {
    const presence = inject(UserPresenceService);
    const styles = inject(DocumentStylesService);
    let stop: (() => void) | undefined;

    afterNextRender(() => {
      stop = presence.whenPresent(styles.duration('--intro-duration'), () => {
        this.gone.set(true);
      });
    });
    inject(DestroyRef).onDestroy(() => {
      stop?.();
    });
  }
}
