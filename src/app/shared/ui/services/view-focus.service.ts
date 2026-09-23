import { inject, Service } from '@angular/core';
import { ClockService } from '@app/core/services';

const CLAIM_DEADLINE_MS = 2500;

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

  public claimWithin(within: () => Element | undefined): () => void {
    const claim = { within, until: this.clock.now() + CLAIM_DEADLINE_MS };
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
