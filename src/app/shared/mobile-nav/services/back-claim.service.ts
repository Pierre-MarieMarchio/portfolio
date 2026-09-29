import { DestroyRef, inject, Service } from '@angular/core';
import { BackLayersService } from './back-layers.service';

const ignore = (): void => {};

@Service({ autoProvided: false })
export class BackClaimService {
  private readonly layers = inject(BackLayersService);
  private release: () => void = ignore;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.letGo();
    });
  }

  public claim(onBack: () => void): void {
    if (this.release === ignore) {
      this.release = this.layers.claim(() => {
        this.release = ignore;
        onBack();
      });
    }
  }

  public letGo(): void {
    this.release();
    this.release = ignore;
  }
}
