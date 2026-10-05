import { afterNextRender, inject, Injector, Service } from '@angular/core';
import { ClockService } from '@app/core/services';

const CLAIM_DEADLINE_MS = 2500;

@Service()
export class ViewFocusService {
  private readonly clock = inject(ClockService);
  private readonly injector = inject(Injector);
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
    afterNextRender(
      () => {
        this.settle();
      },
      { injector: this.injector },
    );
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
    const heading =
      [...this.headings].find((each) => container?.contains(each)) ??
      container?.querySelector<HTMLElement>('[data-window-title]');
    heading?.focus({ preventScroll: true });
    if (heading?.matches(':focus')) {
      this.claim = null;
    }
  }
}
