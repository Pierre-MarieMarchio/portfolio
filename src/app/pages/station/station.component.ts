import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { LANGS } from '@app/core/models';
import { LocaleService } from '@app/core/services';
import { BrowserEnvironmentService } from '@app/core/services';
import {
  OrbitRuleComponent,
  ProjectIndexComponent,
  ProjectPreviewComponent,
  ProjectSheetComponent,
} from '@app/features/projects/components';
import { SpaceSceneComponent } from '@app/features/desktop/components';
import { DesktopView } from '@app/features/desktop/models';
import { DesktopManager } from '@app/features/desktop/states';
import { SocialLink } from '@shared/ui/models';
import { SocialLinksComponent } from '@shared/ui/components';
import { ViewFocusService } from '@shared/ui/services';
import { PanelAnchorDirective } from '@shared/ui/directives';
import { LanguageItem, NavigationItem } from '@shared/ui/models';
import { PageBarComponent } from '@shared/ui/components';
import { PAGES_TEXTS, pathOf, translatePath } from '@app/i18n';
import { CONTACT_ADDRESSES } from '@app/features/profile/data';
import { AboutWindowComponent } from './about-window/about-window.component';
import { ArrivalController } from './arrival/arrival.controller';
import { Curtain } from './arrival/curtain';
import { HeadBottomDirective } from './head-bottom/head-bottom.directive';
import { HomeTitleComponent } from './home-title/home-title.component';
import { IntroCardComponent } from './intro-card/intro-card.component';
import { NotFoundWindowComponent } from './not-found-window/not-found-window.component';
import { StationProjectsBinding } from './station-projects.binding';
import { STATION_IDS } from './station.ids';
import { WindowSlotDirective } from './window-stack/window-slot.directive';
import { WindowSlot, WindowStack } from './window-stack/window-stack';

/**
 * The station: the one screen the reader never leaves. The object, the page
 * bar, the contact rail and the windows live here, above the router, which
 * only says the address. Each window shows on its own address or anywhere
 * once pinned.
 *
 * Composition only: the arrival and its curtain, the windows' depth, the
 * landing focus, the bar's measure and the meeting of the station with the
 * projects each live in a piece of their own, provided here.
 */
@Component({
  selector: 'app-station',
  imports: [
    AboutWindowComponent,
    SocialLinksComponent,
    HeadBottomDirective,
    HomeTitleComponent,
    IntroCardComponent,
    NotFoundWindowComponent,
    SpaceSceneComponent,
    PanelAnchorDirective,
    OrbitRuleComponent,
    PageBarComponent,
    ProjectIndexComponent,
    ProjectPreviewComponent,
    ProjectSheetComponent,
    WindowSlotDirective,
  ],
  providers: [ArrivalController, Curtain, StationProjectsBinding, WindowStack],
  templateUrl: './station.component.html',
  styleUrl: './station.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StationComponent {
  private readonly browser = inject(BrowserEnvironmentService);
  private readonly landing = inject(ViewFocusService);
  private readonly stack = inject(WindowStack);
  private readonly curtain = inject(Curtain);
  private readonly arrivalController = inject(ArrivalController);
  protected readonly station = inject(DesktopManager);
  protected readonly binding = inject(StationProjectsBinding);

  private readonly locale = inject(LocaleService);
  protected readonly texts = inject(PAGES_TEXTS);
  protected readonly ids = STATION_IDS;

  protected readonly navigationItems = computed<readonly NavigationItem[]>(
    () => {
      const words = this.texts().navigation;
      const lang = this.locale.lang();
      return [
        { label: words.home, route: pathOf('home', lang) },
        { label: words.index, route: pathOf('index', lang) },
        { label: words.about, route: pathOf('about', lang) },
      ];
    },
  );

  /** The same page in each language: switching is a navigation (D3). */
  protected readonly languages = computed<readonly LanguageItem[]>(() =>
    LANGS.map((lang) => ({
      code: lang.toUpperCase(),
      name: this.texts().languages[lang],
      lang,
      route: translatePath(this.locale.path(), lang),
      current: lang === this.locale.lang(),
    })),
  );

  protected readonly contactLinks = computed<readonly SocialLink[]>(() =>
    CONTACT_ADDRESSES.map((address) => ({
      ...address,
      label: this.texts().contact[address.icon],
    })),
  );
  protected readonly arrival = this.arrivalController.arrival;

  private readonly homeTitle = viewChild<
    HomeTitleComponent,
    ElementRef<HTMLElement>
  >(HomeTitleComponent, { read: ElementRef });
  private readonly slots = viewChildren<
    WindowSlotDirective,
    ElementRef<HTMLElement>
  >(WindowSlotDirective, { read: ElementRef });

  /** A sheet is a zoom of the index: "Projets" stays lit on it. */
  protected readonly currentRoute = computed(() => {
    const view = this.station.view();
    return pathOf(
      view === 'home' || view === 'about' ? view : 'index',
      this.locale.lang(),
    );
  });

  /** The rule gives way to the preview: one reading at a time. */
  protected readonly showsRule = computed(
    () => this.station.view() === 'home' && this.station.preview() === null,
  );

  /**
   * Set when a spin of the object just ended: the click that follows on the
   * void is the end of a drag, not a request to step back. Cleared at the
   * next pointerdown, so a stale spin never swallows a real click.
   */
  private swallowVoid = false;

  /**
   * Set at the first render in a browser: until then the view may still
   * change as the first address settles, and that is not a navigation.
   * Never set on the server, where there is no focus to move.
   */
  private landed = false;

  constructor() {
    const stops = [
      this.browser.listen('keydown', (event) => {
        if (event.key === 'Escape') {
          void this.station.escape();
        }
      }),
      this.browser.listen(
        'pointerdown',
        () => {
          this.swallowVoid = false;
        },
        { capture: true },
      ),
    ];
    inject(DestroyRef).onDestroy(() => {
      for (const stop of stops) {
        stop();
      }
    });

    // Browser only: on the server there is no one to arrive, and the
    // prerendered page keeps its CSS timing. From then on the reader has
    // landed, and a new view is a navigation.
    afterNextRender(() => {
      this.landed = true;
      this.arrivalController.start(
        untracked(() => this.station.view()) === 'home',
        () => {
          this.curtain.play(() => this.binding.featuredSlugs());
        },
      );
    });

    this.followNavigations();
  }

  /**
   * On a view: its window comes to the front of the pinned ones. After a
   * navigation, and only then (D6), the focus goes to its heading: on the
   * first load it stays at the top of the document, where a reader with a
   * screen reader or a keyboard expects to start.
   */
  private followNavigations(): void {
    let withdraw: (() => void) | undefined;
    effect(() => {
      const view = this.station.view();
      this.station.slug();
      untracked(() => {
        // Leaving the home page is a sign the reader is there.
        if (view !== 'home') {
          this.arrivalController.arrive();
        }
        const slot = slotOf(view);
        if (slot) {
          this.stack.bringToFront(slot);
        }
        withdraw?.();
        withdraw = this.landed ? this.claimFocus(view, slot) : undefined;
      });
    });
  }

  /**
   * On the index a planet selects its row, a second click lets it go; on
   * the home page a featured planet opens or closes the preview, the only
   * ones the home page shows.
   */
  protected onBodyClicked(rank: number): void {
    const slug = this.binding.slugAt(rank);
    if (!slug) {
      return;
    }
    const view = this.station.view();
    if (view === 'index') {
      this.station.select(this.station.selection() === slug ? null : slug);
    } else if (view === 'home' && this.binding.isFeatured(slug)) {
      this.station.togglePreview(slug);
    }
  }

  protected onBodyHovered(rank: number): void {
    this.curtain.takeOver();
    this.station.hover(this.binding.slugAt(rank));
  }

  protected onRuleHovered(slug: string | null): void {
    this.curtain.takeOver();
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
    void this.station.stepBack();
  }

  /** The view's container: the home title, or the slot of its window. */
  private claimFocus(view: DesktopView, slot: WindowSlot | null): () => void {
    return this.landing.claimWithin(() =>
      view === 'home'
        ? this.homeTitle()?.nativeElement
        : this.slots()
            .map((each) => each.nativeElement)
            .find(
              (element) => slot !== null && element.dataset['slot'] === slot,
            ),
    );
  }
}

/** The slot a view shows its window in; the home page has none. */
function slotOf(view: DesktopView): WindowSlot | null {
  switch (view) {
    case 'index':
    case 'about':
    case 'sheet': {
      return view;
    }
    case 'not-found': {
      return 'sheet';
    }
    case 'home': {
      return null;
    }
  }
}
