import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { BrowserEnvironment } from '@app/core/services';
import {
  FamilyFilter,
  ProjectIndexComponent,
  ProjectPreviewComponent,
  ProjectSheetComponent,
} from '@app/features/projects/components';
import { ProjectsManager } from '@app/features/projects/states';
import { StationManager } from '@app/features/station/states';
import {
  ObjectBody,
  ObjectComponent,
  ObjectView,
} from '@app/features/station/components';
import { Arrival } from '@shared/ui/arrival';
import { ContactLink, ContactRailComponent } from '@shared/ui/contact-rail';
import { ObjectPanelDirective } from '@shared/ui/object-marks';
import { NavigationItem, PageBarComponent } from '@shared/ui/page-bar';
import { contactLinks } from '../../app.contact';
import { navigationItems } from '../../app.navigation';
import { AboutWindowComponent } from './about-window/about-window.component';
import { IntroCardComponent } from './intro-card/intro-card.component';
import { NotFoundWindowComponent } from './not-found-window/not-found-window.component';
import { OrbitRuleComponent } from './orbit-rule/orbit-rule.component';
import { STATION_IDS } from './station.ids';

type Slot = 'about' | 'index' | 'sheet' | 'preview';

/**
 * Landing on the home page, the object crosses alone: the rest (the pages,
 * the title, the rule, the contact rail, the planets) arrives at the first
 * gesture, and anyway after 8.7 s, when the crossing is done. Nothing
 * important waits on an action.
 */
const ARRIVAL_AFTER_MS = 8700;

/**
 * The curtain: once the home page's rest has arrived, each marker lights
 * with its planet, one by one, then all settles. The only time the
 * marker-planet link is shown rather than expected.
 */
const CURTAIN_DELAY_MS = 4200;
const CURTAIN_STEP_MS = 900;
const INTENT = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;

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
    IntroCardComponent,
    NotFoundWindowComponent,
    OrbitRuleComponent,
    ObjectComponent,
    ObjectPanelDirective,
    PageBarComponent,
    ProjectIndexComponent,
    ProjectPreviewComponent,
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
  protected readonly contactLinks: readonly ContactLink[] = contactLinks;
  protected readonly ids = STATION_IDS;

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

  /** The featured projects with their facts, for the home rule. */
  protected readonly featuredRows = computed(() => {
    const featured = new Set(
      this.projects.featured().map((project) => project.slug),
    );
    return this.projects.withFacts().filter((row) => featured.has(row.slug));
  });

  /** The rule gives way to the preview: one reading at a time. */
  protected readonly showsRule = computed(
    () => this.station.view() === 'home' && this.station.preview() === null,
  );

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

  /** The reader hovered something: the curtain stops for good. */
  private curtainTakenOver = false;

  /**
   * `timed` in the prerender, where the CSS alone brings the rest in; held
   * by the browser on the home page it landed on, until the reader is there.
   */
  protected readonly arrival = signal<Arrival>('timed');

  /** Lets the rest in; a no-op until the browser holds it. */
  private arrive: () => void = () => undefined;

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

    // Browser only, and never with reduced motion: on the server there is
    // no one to show it to, and the prerendered page must be still.
    afterNextRender(() => {
      // The name and the pages can take two lines (a phone, enlarged text):
      // the windows start under their real height, never under a guessed
      // one, or a window covers the buttons. Written as a CSS variable, so
      // measuring schedules no render.
      const scene = this.scene().nativeElement;
      const head = scene.querySelector<HTMLElement>('app-page-bar');
      const measure = (): void => {
        if (!head) {
          return;
        }
        const bottom =
          head.getBoundingClientRect().bottom -
          scene.getBoundingClientRect().top;
        scene.style.setProperty(
          '--head-bottom',
          `${String(Math.round(bottom))}px`,
        );
      };
      measure();
      if (head) {
        stops.push(this.browser.observeResize(head, measure));
      }

      // Anywhere but the home page, or with reduced motion, all is there at
      // once: only the landing crossing is waited for, as in the mockup.
      if (
        this.browser.prefersReducedMotion() ||
        untracked(() => this.station.view()) !== 'home'
      ) {
        this.arrival.set('shown');
      } else {
        stops.push(this.holdArrival());
      }
    });

    // Arriving on a view: its window comes to the front of the pinned ones,
    // and the focus goes to its heading.
    effect(() => {
      const view = this.station.view();
      this.station.slug();
      untracked(() => {
        // Leaving the home page is a navigation: the reader is there.
        if (view !== 'home') {
          this.arrive();
        }
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
    this.curtainTakenOver = true;
    this.station.hover(this.slugAt(rank));
  }

  protected onRuleHovered(slug: string | null): void {
    this.curtainTakenOver = true;
    this.station.hover(slug);
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

  /**
   * Holds the rest until the first gesture or the end of the crossing, then
   * plays the curtain. Returns the function that stops it wherever it is.
   */
  private holdArrival(): () => void {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const quiet = (): boolean =>
      this.curtainTakenOver ||
      this.station.view() !== 'home' ||
      this.station.preview() !== null;
    const step = (index: number): void => {
      const body = this.projects.featured()[index];
      if (quiet()) {
        return;
      }
      this.station.hover(body?.slug ?? null);
      if (body) {
        timer = setTimeout(() => {
          step(index + 1);
        }, CURTAIN_STEP_MS);
      }
    };
    const intents = INTENT.map((type) =>
      this.browser.listen(type, () => this.arrive(), { passive: true }),
    );
    this.arrive = () => {
      this.arrive = () => undefined;
      intents.forEach((stop) => {
        stop();
      });
      clearTimeout(timer);
      this.arrival.set('shown');
      timer = setTimeout(() => {
        step(0);
      }, CURTAIN_DELAY_MS);
    };
    this.arrival.set('held');
    timer = setTimeout(() => this.arrive(), ARRIVAL_AFTER_MS);
    return () => {
      this.arrive = () => undefined;
      clearTimeout(timer);
      intents.forEach((stop) => {
        stop();
      });
    };
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
      target === 'home'
        ? `#${STATION_IDS.homeTitle}`
        : `[data-slot="${target}"] h1`;
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
