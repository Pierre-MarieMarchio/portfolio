import {
  computed,
  DestroyRef,
  effect,
  inject,
  Service,
  untracked,
  WritableSignal,
} from '@angular/core';
import { ClockService } from '@app/core/services';
import type { BottomSheetDetent } from '../models/bottom-sheet.model';
import { BackLayersService } from './back-layers.service';

const ignore = (): void => {};

@Service({ autoProvided: false })
export class BackClaimService {
  private readonly layers = inject(BackLayersService);
  private readonly clock = inject(ClockService);
  private release: () => void = ignore;
  private wanted = (): boolean => false;
  private lower = ignore;
  private stopRetake = ignore;
  private stopArriving = ignore;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.stopArriving();
      this.stopRetake();
      this.letGo();
    });
  }

  public follow(
    isActive: () => boolean,
    detent: WritableSignal<BottomSheetDetent>,
  ): void {
    this.wanted = computed(() => isActive() && detent() === 'full');
    this.lower = () => {
      detent.set('half');
    };
    effect(() => {
      const isWanted = this.wanted();
      untracked(() => {
        if (isWanted) {
          this.claim();
        } else {
          this.letGo();
        }
      });
    });
  }

  public retake(): void {
    if (this.wanted()) {
      this.claim();
    }
  }

  public retakeOnArrival(isDrawn: () => boolean): void {
    this.stopArriving();
    this.stopArriving = this.layers.onArrive(() => {
      this.stopRetake();
      this.stopRetake = this.clock.nextFrame(() => {
        if (isDrawn()) {
          this.retake();
        }
      });
    });
  }

  public seen(isVisible: boolean): void {
    if (isVisible) {
      this.retake();
    }
  }

  private claim(): void {
    if (this.release === ignore) {
      this.release = this.layers.claim(
        () => {
          this.release = ignore;
          this.lower();
        },
        () => {
          this.release = ignore;
        },
      );
    }
  }

  private letGo(): void {
    this.release();
    this.release = ignore;
  }
}
