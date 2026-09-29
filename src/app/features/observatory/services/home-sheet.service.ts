import { computed, inject, linkedSignal, Service, signal } from '@angular/core';
import { DisplayFormatService } from '@app/core/services';
import { ObservatoryManager } from '@app/features/observatory/states';
import type { SheetDetent } from '@shared/mobile-nav/models';
import { homeDetentAfter, posedSlugOf } from '../rules/home-sheet.rules';

interface Featured {
  readonly slugs: () => readonly string[];
  readonly resting: () => string | null;
}

const NONE: Featured = { slugs: () => [], resting: () => null };

@Service({ autoProvided: false })
export class HomeSheetService {
  private readonly observatory = inject(ObservatoryManager);
  private readonly display = inject(DisplayFormatService);
  private readonly featured = signal<Featured>(NONE);

  public readonly isPhone = computed(() => this.display.format() === 'phone');

  public readonly isShown = computed(
    () => this.isPhone() && this.observatory.view() === 'home',
  );

  public readonly showsTitle = computed(
    () => !this.isPhone() && this.observatory.view() === 'home',
  );

  public readonly anchor = computed(() =>
    this.observatory.preview() === null ? 'rule' : 'preview',
  );

  public readonly detent = linkedSignal<boolean, SheetDetent>({
    source: () => this.observatory.preview() !== null,
    computation: (isPosed, previous) =>
      homeDetentAfter(isPosed, previous?.value),
  });

  public readonly posed = computed(() =>
    posedSlugOf(
      this.featured().slugs(),
      [this.observatory.preview(), this.observatory.hovered()],
      this.featured().resting(),
    ),
  );

  public readonly posedIndex = computed(() =>
    Math.max(
      0,
      this.featured()
        .slugs()
        .indexOf(this.posed() ?? ''),
    ),
  );

  public follow(featured: Featured): void {
    this.featured.set(featured);
  }

  public settle(detent: SheetDetent): void {
    this.detent.set(detent);
    if (detent !== 'full') {
      if (this.observatory.preview() !== null) {
        this.observatory.closePreview();
      }
      return;
    }
    const slug = this.posed();
    if (this.observatory.preview() === null && slug !== null) {
      this.observatory.openPreview(slug);
    }
  }

  public turnTo(index: number): void {
    const slug = this.featured().slugs()[index];
    if (slug !== undefined && this.observatory.preview() !== null) {
      this.observatory.openPreview(slug);
    }
  }
}
