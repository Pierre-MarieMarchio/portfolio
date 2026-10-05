import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  PLATFORM_ID,
  untracked,
  viewChild,
} from '@angular/core';
import { ScrollReleaseDirective } from '../../directives/scroll-release.directive';
import type { SheetDetent, SheetStop } from '../../models/bottom-sheet.model';
import { MOBILE_NAV_PLATFORM } from '../../ports/mobile-nav-platform.port';
import { BackClaimService } from '../../services/back-claim.service';
import {
  detentAfter,
  isAtStop,
  isDismissedBy,
  isFelt,
  shadeFromOf,
  stopOf,
  stopsOf,
} from '../../rules/bottom-sheet.rules';

const CONTROLS = 'button, a, input, select, textarea, label';

const SETTLE_VIBRATION_MS = 10;

const ignore = (): void => {};

@Component({
  selector: 'app-bottom-sheet',
  imports: [ScrollReleaseDirective],
  providers: [BackClaimService],
  templateUrl: './bottom-sheet.component.html',
  styleUrl: './bottom-sheet.component.scss',
  host: {
    '[attr.data-active]': 'isActive() || null',
    '[attr.data-detent]': 'detent()',
  },
})
export class BottomSheetComponent {
  private readonly platform = inject(MOBILE_NAV_PLATFORM);
  private readonly back = inject(BackClaimService);
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly rail = viewChild.required<ElementRef<HTMLElement>>('rail');
  private readonly release = viewChild.required(ScrollReleaseDirective);
  private readonly half = viewChild.required<ElementRef<HTMLElement>>('half');
  private readonly content =
    viewChild.required<ElementRef<HTMLElement>>('content');

  public readonly detents = input<readonly SheetDetent[]>([
    'folded',
    'half',
    'full',
  ]);
  public readonly detent = model<SheetDetent>('half');
  public readonly transient = input(false);
  public readonly dismissed = output();

  public readonly isActive = computed(() => this.platform.isCompact());

  private handle: HTMLElement | null = null;
  private committed: SheetDetent | null = null;
  private origin: SheetDetent = 'half';
  private peek = 0;
  private shadeFrom: number | null = null;
  private band = '';
  private isLanded = false;
  private isHeading = false;
  private isByUser = false;
  private stopFrame: () => void = ignore;
  private stopMeasure: () => void = ignore;
  private readonly stops: (() => void)[] = [];

  constructor() {
    effect(() => {
      const detent = this.detent();
      const isActive = this.isActive();
      untracked(() => {
        if (isActive) {
          this.ask(detent);
        }
      });
    });
    this.back.follow(this.isActive, this.detent);
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      afterNextRender(() => {
        this.land();
      });
    }
    inject(DestroyRef).onDestroy(() => {
      this.stopFrame();
      this.stopMeasure();
      for (const stop of this.stops) {
        stop();
      }
    });
  }

  public toggle(): void {
    if (!this.isActive()) {
      return;
    }
    this.isByUser = true;
    const isFolded = this.detent() === 'folded';
    const target = this.stopsNow().find(
      (stop) => (stop.detent === 'folded') !== isFolded,
    );
    if (target) {
      this.head(target);
    }
  }

  public hold(handle: HTMLElement): () => void {
    this.handle = handle;
    const stop = this.platform.onResize(handle, () => {
      this.measureSoon();
    });
    return () => {
      stop();
      if (this.handle === handle) {
        this.handle = null;
      }
    };
  }

  protected press(): void {
    this.stopFrame();
    this.isByUser = false;
    this.isHeading = false;
    this.origin = this.detent();
  }

  protected letGo(vy: number, pull = 0): void {
    const stops = this.stopsNow();
    const origin = stopOf(stops, this.origin);
    if (!origin) {
      return;
    }
    this.isByUser = true;
    const top = this.rail().nativeElement.scrollTop;
    if (this.transient() && isDismissedBy(stops, origin.detent, top, pull)) {
      this.dismissed.emit();
      return;
    }
    const stop = stopOf(
      stops,
      detentAfter(origin.detent, top - origin.at, vy, stops),
    );
    if (stop) {
      this.head(stop);
    }
  }

  protected settle(): void {
    const top = this.rail().nativeElement.scrollTop;
    const resting = this.stopsNow().find((stop) => isAtStop(top, stop.at));
    if (resting) {
      this.isHeading = false;
      this.commit(resting);
    } else if (!this.isHeading) {
      this.letGo(0);
    }
  }

  private land(): void {
    const onTap = (event: Event): void => {
      this.tap(event);
    };
    this.element.addEventListener('pointerup', onTap, { capture: true });
    this.stops.push(
      () => {
        this.element.removeEventListener('pointerup', onTap, {
          capture: true,
        });
      },
      this.platform.onResize(this.rail().nativeElement, () => {
        this.measureSoon();
      }),
      this.platform.onResize(this.content().nativeElement, () => {
        this.measureSoon();
      }),
      this.platform.onVisible(this.rail().nativeElement, (isVisible) => {
        this.back.seen(isVisible);
      }),
    );
    this.isLanded = true;
  }

  private tap(event: Event): void {
    const target = event.target instanceof Element ? event.target : null;
    if (
      this.isActive() &&
      this.detent() === 'folded' &&
      target &&
      this.handle?.contains(target) &&
      !target.closest(CONTROLS)
    ) {
      event.stopPropagation();
      this.toggle();
    }
  }

  private ask(detent: SheetDetent): void {
    this.origin = detent;
    this.stopFrame();
    const isAlready = [null, detent].includes(this.committed);
    if (!this.isLanded || (isAlready && !this.isHeading)) {
      return;
    }
    this.stopFrame = this.platform.nextFrame(() => {
      const stop = stopOf(this.stopsNow(), detent);
      if (stop) {
        this.head(stop);
      }
    });
  }

  private head(stop: SheetStop): void {
    const rail = this.rail().nativeElement;
    this.origin = stop.detent;
    const isThere = !this.isHeading && isAtStop(rail.scrollTop, stop.at);
    const isInstant = this.platform.reducedMotion();
    this.isHeading = !isThere && !isInstant;
    if (!isThere) {
      rail.scrollTo({
        top: stop.at,
        behavior: isInstant ? 'instant' : 'smooth',
      });
    }
    if (!this.isHeading) {
      this.commit(stop);
    }
  }

  private measureSoon(): void {
    this.stopMeasure();
    this.stopMeasure = this.platform.nextFrame(() => {
      if (this.rail().nativeElement.clientHeight > 0) {
        this.back.retake();
      }
      this.measure();
    });
  }

  private readonly isSettled = (): boolean =>
    !this.release().isTouching && !this.isHeading;

  private measure(): void {
    const rail = this.rail().nativeElement;
    if (!this.isActive() || !this.isSettled() || rail.clientHeight === 0) {
      return;
    }
    const peek = this.peekNow();
    if (Math.abs(peek - this.peek) >= 0.5) {
      this.peek = peek;
      this.element.style.setProperty('--mnav-sheet-peek', `${String(peek)}px`);
    }
    const stop = stopOf(this.stopsNow(), this.committed ?? this.detent());
    if (!stop) {
      return;
    }
    if (!isAtStop(rail.scrollTop, stop.at)) {
      rail.scrollTo({ top: stop.at, behavior: 'instant' });
    }
    this.commit(stop);
  }

  private commit(stop: SheetStop): void {
    this.origin = stop.detent;
    const band = `${String(this.peek + stop.at)}px`;
    if (band !== this.band) {
      this.band = band;
      this.element.style.setProperty('--mnav-sheet-band', band);
    }
    if (isFelt(this.isByUser, this.committed, stop.detent)) {
      this.platform.vibrate(SETTLE_VIBRATION_MS);
    }
    this.isByUser = false;
    this.committed = stop.detent;
    if (this.detent() !== stop.detent) {
      this.detent.set(stop.detent);
    }
  }

  private stopsNow(): SheetStop[] {
    const content = this.content().nativeElement;
    const stops = stopsOf(this.detents(), {
      peek: this.peek,
      half: this.half().nativeElement.offsetHeight,
      end:
        content.offsetTop +
        content.offsetHeight -
        this.rail().nativeElement.clientHeight,
    });
    const from = shadeFromOf(stops);
    if (from !== this.shadeFrom) {
      this.shadeFrom = from;
      this.element.toggleAttribute('data-rising', from !== null);
      this.element.style.setProperty(
        '--mnav-sheet-shade-from',
        `${String(from ?? 0)}px`,
      );
    }
    return stops;
  }

  private peekNow(): number {
    const top = this.content().nativeElement.getBoundingClientRect().top;
    const bottom = this.handle?.getBoundingClientRect().bottom ?? top;
    return Math.max(bottom - top, 0);
  }
}
