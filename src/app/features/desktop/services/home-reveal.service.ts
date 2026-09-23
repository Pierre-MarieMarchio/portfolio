import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { DocumentStylesService, UserPresenceService } from '@app/core/services';
import { Entrance } from '@shared/ui/models';

/**
 * When the home page's rest arrives (see `Arrival`). Landing on the home
 * page, the object crosses alone: the pages, the title, the rule, the
 * contact rail and the planets come at the first gesture, and anyway at the
 * end of the crossing (`--arrival-at`, read from the CSS, which plays the
 * same timing without a script). Nothing important waits on an action.
 *
 * Provided by the station: one per station, gone with it.
 */
@Injectable()
export class HomeRevealService {
  private readonly styles = inject(DocumentStylesService);
  private readonly presence = inject(UserPresenceService);
  private readonly state = signal<Entrance>('timed');
  private cancel: () => void = () => {};
  private onArrived: () => void = () => {};

  /** `timed` in the prerender, where the CSS alone brings the rest in. */
  public readonly arrival = this.state.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.cancel();
    });
  }

  /**
   * Holds the rest on the home page the browser landed on, until the reader
   * is there. Anywhere else, or with reduced motion, all is there at once:
   * only the landing crossing is waited for, as in the mockup. `onArrived`
   * runs when a held rest is let in, never when it was shown at once.
   */
  public start(isOnHome: boolean, onArrived: () => void): void {
    if (!isOnHome) {
      this.state.set('shown');
      return;
    }
    this.state.set('held');
    this.cancel = this.presence.whenPresent(
      this.styles.duration('--arrival-at'),
      () => {
        this.arrive();
      },
    );
    if (this.state() === 'held') {
      this.onArrived = onArrived;
    }
  }

  /** Lets a held rest in now: leaving the home page is a sign of presence. */
  public arrive(): void {
    if (this.state() !== 'held') {
      return;
    }
    this.cancel();
    this.cancel = () => {};
    this.state.set('shown');
    this.onArrived();
  }
}
