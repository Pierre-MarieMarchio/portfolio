import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  untracked,
  viewChild,
} from '@angular/core';
import { BrowserEnvironment } from '@app/core/services';
import {
  FamilyFilter,
  ProjectIndexComponent,
  ProjectSheetComponent,
} from '@app/features/projects/components';
import { ProjectsManager } from '@app/features/projects/states';
import { StationManager } from '@app/features/station/states';
import { ObjectBody, ObjectComponent, ObjectView } from '@shared/ui/object';
import { NavigationItem, PageBarComponent } from '@shared/ui/page-bar';
import { navigationItems } from '../../app.navigation';
import { AboutWindowComponent } from './about-window.component';
import { ContactRailComponent } from './contact-rail.component';
import { NotFoundWindowComponent } from './not-found-window.component';

type Slot = 'about' | 'index' | 'sheet' | 'preview';

/** The claim on the landing heading gives up after this: never loop. */
const FOCUS_DEADLINE_MS = 2500;

/**
 * The station: the one screen the reader never leaves. The object, the page
 * bar, the contact rail and the windows live here, above the router, which
 * only says the address. Each window shows on its own address or anywhere
 * once pinned.
 *
 * This is where the station meets the projects, so this is where a sheet's
 * slug is found to name a project or not.
 */
@Component({
  selector: 'app-station',
  imports: [
    AboutWindowComponent,
    ContactRailComponent,
    NotFoundWindowComponent,
    ObjectComponent,
    PageBarComponent,
    ProjectIndexComponent,
    ProjectSheetComponent,
  ],
  templateUrl: './station.component.html',
  styleUrl: './station.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StationComponent {
  private readonly browser = inject(BrowserEnvironment);
  protected readonly station = inject(StationManager);
  protected readonly projects = inject(ProjectsManager);

  protected readonly navigationItems: readonly NavigationItem[] =
    navigationItems;

  private readonly scene = viewChild.required<ElementRef<HTMLElement>>('scene');

  /** A sheet is a zoom of the index: "Projets" stays lit on it. */
  protected readonly currentRoute = computed(() => {
    switch (this.station.view()) {
      case 'home':
        return '/';
      case 'about':
        return '/a-propos';
      default:
        return '/projets';
    }
  });

  /** The slug of the sheet on show, when it names a project. */
  protected readonly sheetSlug = computed(() => {
    const slug = this.station.slug();
    return slug && this.projects.find(slug) ? slug : null;
  });

  protected readonly isNotFound = computed(
    () =>
      this.station.view() === 'not-found' ||
      (this.station.view() === 'sheet' && this.sheetSlug() === null),
  );

  /** The station keeps the filter opaque; only a known family passes. */
  protected readonly family = computed<FamilyFilter>(() => {
    const family = this.station.family();
    return family === 'professional' || family === 'personal' ? family : 'all';
  });

  /** The void closes one notch back, where there is one to close. */
  protected readonly voidCloses = computed(() => {
    const view = this.station.view();
    return (
      view === 'sheet' ||
      (view === 'home' && this.station.preview() !== null) ||
      (view === 'index' && this.station.selection() !== null)
    );
  });

  /** Last touched in front; written into the DOM, rendering needs no order. */
  private order: Slot[] = ['about', 'index', 'sheet', 'preview'];

  /**
   * The object speaks in ranks, the station in slugs: the rank is the
   * catalog's order, so the two meet here.
   */
  protected readonly bodies = computed<readonly ObjectBody[]>(() =>
    this.projects
      .projects()
      .map((project) => ({ title: project.title, short: project.short })),
  );

  protected readonly objectView = computed<ObjectView>(() =>
    this.isNotFound() ? 'not-found' : this.station.view(),
  );

  protected readonly focusRank = computed(() => this.rankOf(this.sheetSlug()));
  protected readonly previewRank = computed(() =>
    this.rankOf(this.station.preview()),
  );
  protected readonly selectedRank = computed(() =>
    this.rankOf(this.station.selection()),
  );
  protected readonly hoveredRank = computed(() =>
    this.rankOf(this.station.hovered()),
  );

  /** The part is a two-digit key ("00"…"03"); the object counts from 0. */
  protected readonly partIndex = computed(() => {
    const part = Number.parseInt(this.station.part(), 10);
    return Number.isFinite(part) ? part : 0;
  });

  /**
   * Set when a spin of the object just ended: the click that follows on the
   * void is the end of a drag, not a request to step back. Cleared at the
   * next pointerdown, so a stale spin never swallows a real click.
   */
  private swallowVoid = false;

  constructor() {
    const stops = [
      this.browser.listen('keydown', (event) => {
        if (event.key === 'Escape') {
          void this.station.escape();
        }
      }),
      // Capture, so a window comes to the front before its own handlers run.
      this.browser.listen(
        'pointerdown',
        (event) => {
          this.swallowVoid = false;
          const slot =
            event.target instanceof Element
              ? event.target.closest<HTMLElement>('[data-slot]')
              : null;
          const name = slot?.dataset['slot'];
          if (isSlot(name)) {
            this.bringToFront(name);
          }
        },
        { capture: true },
      ),
    ];
    let cancelClaim: () => void = () => undefined;
    inject(DestroyRef).onDestroy(() => {
      stops.forEach((stop) => {
        stop();
      });
      cancelClaim();
    });

    // Arriving on a view: its window comes to the front of the pinned ones,
    // and the focus goes to its heading.
    effect(() => {
      const view = this.station.view();
      this.station.slug();
      untracked(() => {
        const slot = slotOf(view);
        if (slot) {
          this.bringToFront(slot);
        }
        cancelClaim();
        cancelClaim = this.claimFocus(view === 'home' ? 'home' : slot);
      });
    });
  }

  protected onFamily(family: FamilyFilter): void {
    this.station.filter(family);
  }

  /**
   * On the index a planet selects its row, a second click lets it go;
   * anywhere else it opens or closes the preview.
   */
  protected onBodyClicked(rank: number): void {
    const slug = this.slugAt(rank);
    if (!slug) {
      return;
    }
    if (this.station.view() === 'index') {
      this.station.select(this.station.selection() === slug ? null : slug);
    } else {
      this.station.togglePreview(slug);
    }
  }

  protected onBodyHovered(rank: number): void {
    this.station.hover(this.slugAt(rank));
  }

  protected onSpun(): void {
    this.swallowVoid = true;
  }

  protected onVoid(): void {
    if (this.swallowVoid) {
      this.swallowVoid = false;
      return;
    }
    void this.station.clickVoid();
  }

  private slugAt(rank: number): string | null {
    return this.projects.projects()[rank]?.slug ?? null;
  }

  private rankOf(slug: string | null): number {
    return slug === null
      ? -1
      : this.projects.projects().findIndex((project) => project.slug === slug);
  }

  private bringToFront(slot: Slot): void {
    if (this.order.at(-1) === slot) {
      return;
    }
    this.order = [...this.order.filter((each) => each !== slot), slot];
    const scene = this.scene().nativeElement;
    this.order.forEach((each, index) => {
      const element = scene.querySelector<HTMLElement>(`[data-slot="${each}"]`);
      if (element) {
        element.style.zIndex = String(5 + index);
      }
    });
  }

  /**
   * Windows mount a frame late, so the heading is claimed at the first frame
   * where it exists rather than aimed at once, with a deadline so the claim
   * never loops.
   */
  private claimFocus(target: Slot | 'home' | null): () => void {
    if (!target) {
      return () => undefined;
    }
    const selector =
      target === 'home' ? '#titre-accueil' : `[data-slot="${target}"] h1`;
    const started = Date.now();
    let cancel: () => void = () => undefined;
    const attempt = (): void => {
      const heading =
        this.scene().nativeElement.querySelector<HTMLElement>(selector);
      if (heading) {
        heading.focus({ preventScroll: true });
        return;
      }
      if (Date.now() - started < FOCUS_DEADLINE_MS) {
        cancel = this.browser.nextFrame(attempt);
      }
    };
    cancel = this.browser.nextFrame(attempt);
    return () => {
      cancel();
    };
  }
}

const SLOTS: readonly string[] = ['about', 'index', 'sheet', 'preview'];

const isSlot = (name: string | undefined): name is Slot =>
  name !== undefined && SLOTS.includes(name);

const slotOf = (view: string): Slot | null => {
  switch (view) {
    case 'index':
      return 'index';
    case 'about':
      return 'about';
    case 'sheet':
    case 'not-found':
      return 'sheet';
    default:
      return null;
  }
};
