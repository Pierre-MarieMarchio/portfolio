import { DestroyRef, inject, Service } from '@angular/core';
import { ClockService } from '@app/core/services';
import { DesktopManager } from '@app/features/desktop/states';

const CURTAIN_DELAY_MS = 4200;
const CURTAIN_STEP_MS = 900;

@Service({ autoProvided: false })
export class FeaturedTourService {
  private readonly station = inject(DesktopManager);
  private readonly clock = inject(ClockService);
  private cancelStep: () => void = () => {};
  private takenOver = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.cancelStep();
    });
  }

  public play(slugs: () => readonly string[]): void {
    this.cancelStep();
    this.cancelStep = this.clock.after(CURTAIN_DELAY_MS, () => {
      this.step(slugs, 0);
    });
  }

  public takeOver(): void {
    this.takenOver = true;
  }

  private step(slugs: () => readonly string[], index: number): void {
    if (
      this.takenOver ||
      this.station.view() !== 'home' ||
      this.station.preview() !== null
    ) {
      return;
    }
    const slug = slugs()[index];
    this.station.hover(slug ?? null);
    if (slug !== undefined) {
      this.cancelStep = this.clock.after(CURTAIN_STEP_MS, () => {
        this.step(slugs, index + 1);
      });
    }
  }
}
