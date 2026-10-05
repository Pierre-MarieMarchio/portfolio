import {
  computed,
  DestroyRef,
  effect,
  inject,
  Service,
  signal,
  untracked,
} from '@angular/core';
import { DocumentStylesService, UserPresenceService } from '@app/core/services';
import { ObservatoryManager } from '@app/features/observatory/states';
import { Entrance } from '@shared/ui/models';

@Service({ autoProvided: false })
export class HomeRevealService {
  private readonly styles = inject(DocumentStylesService);
  private readonly presence = inject(UserPresenceService);
  private readonly station = inject(ObservatoryManager);
  private readonly state = signal<Entrance>('timed');
  private cancel: () => void = () => {};
  private onArrived: () => void = () => {};

  public readonly arrival = computed<Entrance>(() =>
    this.station.view() === 'home' ? this.state() : 'shown',
  );

  public readonly isOpening = computed(() => this.arrival() !== 'shown');

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.cancel();
    });
    effect(() => {
      if (this.station.view() !== 'home') {
        untracked(() => {
          this.arrive();
        });
      }
    });
  }

  public start(onArrived: () => void): void {
    if (untracked(() => this.station.view()) !== 'home') {
      this.state.set('shown');
      return;
    }
    this.state.set('withheld');
    this.cancel = this.presence.whenPresent(
      this.styles.duration('--arrival-at'),
      () => {
        this.arrive();
      },
    );
    if (this.state() === 'withheld') {
      this.onArrived = onArrived;
    }
  }

  public arrive(): void {
    if (this.state() !== 'withheld') {
      return;
    }
    this.cancel();
    this.cancel = () => {};
    this.state.set('shown');
    this.onArrived();
  }
}
