import { DestroyRef, inject, Service, signal } from '@angular/core';
import { DocumentStylesService, UserPresenceService } from '@app/core/services';
import { Entrance } from '@shared/ui/models';

@Service({ autoProvided: false })
export class HomeRevealService {
  private readonly styles = inject(DocumentStylesService);
  private readonly presence = inject(UserPresenceService);
  private readonly state = signal<Entrance>('timed');
  private cancel: () => void = () => {};
  private onArrived: () => void = () => {};

  public readonly arrival = this.state.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.cancel();
    });
  }

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
