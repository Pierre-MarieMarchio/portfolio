import { inject, Service } from '@angular/core';
import { ClockService } from '@app/core/services';

/** A claim gives up after this: a heading that never came is not waited for. */
const DEADLINE_MS = 2500;

/**
 * Where the focus lands when the reader arrives on a view: the view's
 * heading. Every such heading signs in (`appViewHeading`); the station
 * claims the one inside the view's container, and the claim is kept until
 * that heading is there, since a window mounts in the render after the
 * navigation, and never past a deadline.
 *
 * Plain sets, not state: nothing here is rendered.
 */
@Service()
export class ViewFocusService {
  private readonly clock = inject(ClockService);
  private readonly headings = new Set<HTMLElement>();
  private claim: {
    readonly within: () => Element | undefined;
    readonly until: number;
  } | null = null;

  public add(heading: HTMLElement): () => void {
    this.headings.add(heading);
    this.settle();
    return () => {
      this.headings.delete(heading);
    };
  }

  /**
   * Focuses the heading inside `within`, now or as soon as it signs in, and
   * returns the function that withdraws the claim. A new claim replaces the
   * last one. The container is asked for each time: it may not exist yet
   * either, when the view mounts it with its heading.
   */
  public claimWithin(within: () => Element | undefined): () => void {
    const claim = { within, until: this.clock.now() + DEADLINE_MS };
    this.claim = claim;
    this.settle();
    return () => {
      if (this.claim === claim) {
        this.claim = null;
      }
    };
  }

  private settle(): void {
    const claim = this.claim;
    if (!claim) {
      return;
    }
    if (this.clock.now() > claim.until) {
      this.claim = null;
      return;
    }
    const container = claim.within();
    const heading = container
      ? [...this.headings].find((each) => container.contains(each))
      : undefined;
    if (heading) {
      this.claim = null;
      heading.focus({ preventScroll: true });
    }
  }
}
