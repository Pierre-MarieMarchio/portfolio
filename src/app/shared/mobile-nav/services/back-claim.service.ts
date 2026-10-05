import {
  computed,
  DestroyRef,
  effect,
  inject,
  Service,
  untracked,
  WritableSignal,
} from '@angular/core';
import type { BottomSheetDetent } from '../models/bottom-sheet.model';
import { BackLayersService } from './back-layers.service';

const ignore = (): void => {};

@Service({ autoProvided: false })
export class BackClaimService {
  private readonly layers = inject(BackLayersService);
  private release: () => void = ignore;
  private wanted = (): boolean => false;
  private lower = ignore;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
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
