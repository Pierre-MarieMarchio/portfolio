import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  linkedSignal,
  untracked,
  viewChild,
} from '@angular/core';
import { LANGS } from '@app/core/models';
import { LocaleService } from '@app/core/services';
import {
  FeaturedBarComponent,
  ProjectListComponent,
  ProjectPreviewComponent,
  ProjectDetailComponent,
} from '@app/features/projects/components';
import { FAMILIES, FamilyFilter } from '@app/features/projects/models';
import { ProjectsManager } from '@app/features/projects/states';
import { DesktopSceneComponent } from '@app/features/desktop/components';
import {
  DesktopView,
  DesktopWindow,
  Planet,
} from '@app/features/desktop/models';
import { AnimationManager, DesktopManager } from '@app/features/desktop/states';
import { windowOf } from '../../features/desktop/rules/view.rules';
import { SocialLink } from '@shared/ui/models';
import { SocialLinksComponent } from '@shared/ui/components';
import { ViewFocusService } from '@shared/ui/services';
import { PanelAnchorDirective } from '@shared/ui/directives';
import { LanguageItem, NavigationItem } from '@shared/ui/models';
import { PageBarComponent } from '@shared/ui/components';
import { DESKTOP_TEXTS } from '@app/features/desktop/ports';
import { PROFILE_TEXTS } from '@app/features/profile/ports';
import { PAGES_TEXTS, pathOf, translatePath } from '@app/i18n';
import { CONTACT_ADDRESSES } from '@app/features/profile/data';
import { AboutWindowComponent } from '../../features/profile/components/about-window/about-window.component';
import { HomeRevealService } from '../../features/desktop/services/home-reveal.service';
import { FeaturedTourService } from '../../features/desktop/services/featured-tour.service';
import { BottomEdgeVariableDirective } from '../../shared/ui/directives/bottom-edge-variable.directive';
import { HomeTitleComponent } from '../../features/desktop/components/home-title/home-title.component';
import { IntroCardComponent } from '../../features/desktop/components/intro-card/intro-card.component';
import { NotFoundWindowComponent } from '../../features/desktop/components/not-found-window/not-found-window.component';
import { DESKTOP_IDS } from '../../features/desktop/models/desktop-ids.model';
import { StackedWindowDirective } from '@shared/windows/directives';
import { WindowStackService } from '@shared/windows/services';

/**
 * The station: the one screen the reader never leaves. The object, the page
 * bar, the contact rail and the windows live here, above the router, which
 * only says the address. Each window shows on its own address or anywhere
 * once pinned.
 */
@Component({
  selector: 'app-desktop-page',
  imports: [
    AboutWindowComponent,
    SocialLinksComponent,
    BottomEdgeVariableDirective,
    HomeTitleComponent,
    IntroCardComponent,
    NotFoundWindowComponent,
    DesktopSceneComponent,
    PanelAnchorDirective,
    FeaturedBarComponent,
    PageBarComponent,
    ProjectListComponent,
    ProjectPreviewComponent,
    ProjectDetailComponent,
    StackedWindowDirective,
  ],
  providers: [HomeRevealService, FeaturedTourService, WindowStackService],
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  templateUrl: './desktop-page.component.html',
  styleUrl: './desktop-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesktopPageComponent {
  private readonly landing = inject(ViewFocusService);
  private readonly stack = inject(WindowStackService);
  private readonly curtain = inject(FeaturedTourService);
  private readonly arrivalController = inject(HomeRevealService);
  protected readonly station = inject(DesktopManager);
  protected readonly animation = inject(AnimationManager);
  protected readonly projects = inject(ProjectsManager);

  private readonly locale = inject(LocaleService);
  protected readonly texts = inject(PAGES_TEXTS);
  protected readonly desktopTexts = inject(DESKTOP_TEXTS);
  private readonly profileTexts = inject(PROFILE_TEXTS);
  protected readonly ids = DESKTOP_IDS;

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
      label: this.profileTexts().contact[address.icon],
    })),
  );
  protected readonly arrival = this.arrivalController.arrival;

  protected readonly planets = computed<readonly Planet[]>(() =>
    this.projects
      .projects()
      .map(({ slug, title, short }) => ({ slug, title, short })),
  );

  protected readonly sheetSlug = computed(() => {
    const slug = this.station.slug();
    return slug && this.projects.find(slug) ? slug : null;
  });

  protected readonly isNotFound = computed(
    () =>
      this.station.view() === 'not-found' ||
      (this.station.view() === 'sheet' && this.sheetSlug() === null),
  );

  protected readonly sceneView = computed<DesktopView>(() =>
    this.isNotFound() ? 'not-found' : this.station.view(),
  );

  protected readonly family = computed<FamilyFilter>(
    () => FAMILIES.find((family) => family === this.station.family()) ?? 'all',
  );

  private readonly featuredSlugs = computed(() =>
    this.projects.featured().map((project) => project.slug),
  );

  protected readonly featuredCount = computed(
    () => this.projects.featured().length,
  );

  protected readonly projectCount = computed(
    () => this.projects.ranked().length,
  );

  private readonly frontWindow = linkedSignal({
    source: () => ({ view: this.station.view(), slug: this.station.slug() }),
    computation: ({ view }) => windowOf(view),
    equal: () => false,
  });

  private readonly homeTitle = viewChild<
    HomeTitleComponent,
    ElementRef<HTMLElement>
  >(HomeTitleComponent, { read: ElementRef });
  private readonly aboutSlot =
    viewChild.required<ElementRef<HTMLElement>>('aboutSlot');
  private readonly indexSlot =
    viewChild.required<ElementRef<HTMLElement>>('indexSlot');
  private readonly sheetSlot =
    viewChild.required<ElementRef<HTMLElement>>('sheetSlot');
  private readonly previewSlot =
    viewChild.required<ElementRef<HTMLElement>>('previewSlot');

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
   * Set at the first render in a browser: until then the view may still
   * change as the first address settles, and that is not a navigation.
   * Never set on the server, where there is no focus to move.
   */
  private landed = false;

  constructor() {
    afterNextRender(() => {
      this.landed = true;
      this.arrivalController.start(
        untracked(() => this.station.view()) === 'home',
        () => {
          this.curtain.play(() => this.featuredSlugs());
        },
      );
    });

    this.revealOnLeavingHome();
    this.bringViewWindowToFront();
    this.focusAfterNavigations();
  }

  private revealOnLeavingHome(): void {
    effect(() => {
      if (this.station.view() !== 'home') {
        untracked(() => {
          this.arrivalController.arrive();
        });
      }
    });
  }

  private bringViewWindowToFront(): void {
    effect(() => {
      const front = this.frontWindow();
      if (front) {
        untracked(() => {
          this.stack.bringToFront(front);
        });
      }
    });
  }

  private focusAfterNavigations(): void {
    let withdraw: (() => void) | undefined;
    effect(() => {
      const shown = windowOf(this.station.view());
      this.station.slug();
      untracked(() => {
        withdraw?.();
        withdraw = this.landed ? this.claimFocus(shown) : undefined;
      });
    });
  }

  protected onEscape(): void {
    void this.station.escape();
  }

  /**
   * On the index a planet selects its row, a second click lets it go; on
   * the home page a featured planet opens or closes the preview, the only
   * ones the home page shows.
   */
  protected onBodyClicked(slug: string): void {
    const view = this.station.view();
    if (view === 'index') {
      this.station.select(this.station.selected() === slug ? null : slug);
    } else if (view === 'home' && this.projects.isFeatured(slug)) {
      this.station.togglePreview(slug);
    }
  }

  protected onBodyHovered(slug: string | null): void {
    this.curtain.takeOver();
    this.station.hover(slug);
  }

  protected onRuleHovered(slug: string | null): void {
    this.curtain.takeOver();
    this.station.hover(slug);
  }

  protected onVoid(): void {
    void this.station.stepBack();
  }

  /** The view's container: the home title, or the slot of its window. */
  private claimFocus(shown: DesktopWindow | null): () => void {
    return this.landing.claimWithin(() =>
      shown === null
        ? this.homeTitle()?.nativeElement
        : this.slotOf(shown).nativeElement,
    );
  }

  private slotOf(shown: DesktopWindow): ElementRef<HTMLElement> {
    switch (shown) {
      case 'about': {
        return this.aboutSlot();
      }
      case 'index': {
        return this.indexSlot();
      }
      case 'sheet': {
        return this.sheetSlot();
      }
      case 'preview': {
        return this.previewSlot();
      }
    }
  }
}
