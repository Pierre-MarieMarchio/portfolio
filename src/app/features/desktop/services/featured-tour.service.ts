import { DestroyRef, inject, Service } from '@angular/core';
import { ClockService } from '@app/core/services';
import { DesktopManager } from '@app/features/desktop/states';

/** After the rest has arrived, the curtain waits this long before it plays. */
const CURTAIN_DELAY_MS = 4200;
/** Then each marker stays lit with its planet this long. */
const CURTAIN_STEP_MS = 900;

/**
 * The curtain: once the home page's rest has arrived, each marker of the rule
 * lights with its planet, one by one, then all settles. The only time the
 * marker-planet link is shown rather than expected.
 *
 * It gives way to the reader for good: at the first hover of their own, on
 * leaving the home page, or with a preview open.
 *
 * Provided by the station: one per station, gone with it.
 */
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

  /** Plays through `slugs`, read at each step, from the first. */
  public play(slugs: () => readonly string[]): void {
    this.cancelStep();
    this.cancelStep = this.clock.after(CURTAIN_DELAY_MS, () => {
      this.step(slugs, 0);
    });
  }

  /** The reader pointed at something: the curtain stops for good. */
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
