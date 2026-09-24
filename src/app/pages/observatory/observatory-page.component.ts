import {
  afterNextRender,
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
import { DisplayFormatService, LocaleService } from '@app/core/services';
import {
  FeaturedBarComponent,
  ProjectListComponent,
  ProjectPreviewComponent,
  ProjectDetailComponent,
} from '@app/features/projects/components';
import { FAMILIES, FamilyFilter } from '@app/features/projects/models';
import { ProjectsManager } from '@app/features/projects/states';
import { ObservatorySceneComponent } from '@app/features/observatory/components';
import {
  ObservatoryView,
  ObservatoryWindow,
  Planet,
} from '@app/features/observatory/models';
import {
  AnimationManager,
  ObservatoryManager,
} from '@app/features/observatory/states';
import { windowOf } from '../../features/observatory/rules/view.rules';
import { SceneAnchorKind } from '@app/features/common';
import { SocialLink } from '@shared/ui/models';
import {
  LanguageSwitchComponent,
  MainNavComponent,
  SocialLinksComponent,
} from '@shared/ui/components';
import { ViewFocusService } from '@shared/ui/services';
import {
  BottomEdgeVariableDirective,
  LayoutAnchorDirective,
} from '@shared/ui/directives';
import { LanguageItem, NavigationItem } from '@shared/ui/models';
import { OBSERVATORY_TEXTS } from '@app/features/observatory/ports';
import { PROFILE_TEXTS } from '@app/features/profile/ports';
import { PAGES_TEXTS, pathOf, translatePath } from '@app/i18n';
import { CONTACT_ADDRESSES } from '@app/features/profile/data';
import { AboutWindowComponent } from '../../features/profile/components/about-window/about-window.component';
import { HomeRevealService } from '../../features/observatory/services/home-reveal.service';
import { FeaturedTourService } from '../../features/observatory/services/featured-tour.service';
import { AnimationToggleComponent } from '../../features/observatory/components/animation-toggle/animation-toggle.component';
import { HomeTitleComponent } from '../../features/observatory/components/home-title/home-title.component';
import { IntroCardComponent } from '../../features/observatory/components/intro-card/intro-card.component';
import { NotFoundWindowComponent } from '../../features/observatory/components/not-found-window/not-found-window.component';
import { OBSERVATORY_IDS } from '../../features/observatory/models/observatory-ids.model';
import { StackedWindowDirective } from '@shared/windows/directives';
import { WindowStackService } from '@shared/windows/services';

@Component({
  selector: 'app-observatory-page',
  imports: [
    AboutWindowComponent,
    AnimationToggleComponent,
    SocialLinksComponent,
    BottomEdgeVariableDirective,
    HomeTitleComponent,
    IntroCardComponent,
    NotFoundWindowComponent,
    ObservatorySceneComponent,
    LayoutAnchorDirective,
    FeaturedBarComponent,
    LanguageSwitchComponent,
    MainNavComponent,
    ProjectListComponent,
    ProjectPreviewComponent,
    ProjectDetailComponent,
    StackedWindowDirective,
  ],
  providers: [HomeRevealService, FeaturedTourService, WindowStackService],
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  templateUrl: './observatory-page.component.html',
  styleUrl: './observatory-page.component.scss',
})
export class ObservatoryPageComponent {
  private readonly landing = inject(ViewFocusService);
  private readonly stack = inject(WindowStackService);
  private readonly curtain = inject(FeaturedTourService);
  private readonly arrivalController = inject(HomeRevealService);
  protected readonly station = inject(ObservatoryManager);
  protected readonly animation = inject(AnimationManager);
  protected readonly projects = inject(ProjectsManager);

  private readonly locale = inject(LocaleService);
  protected readonly texts = inject(PAGES_TEXTS);
  protected readonly observatoryTexts = inject(OBSERVATORY_TEXTS);
  private readonly profileTexts = inject(PROFILE_TEXTS);
  protected readonly ids = OBSERVATORY_IDS;
  protected readonly anchor: {
    readonly [K in Exclude<SceneAnchorKind, 'line'>]: K;
  } = {
    panel: 'panel',
    head: 'head',
    rule: 'rule',
    detail: 'detail',
    preview: 'preview',
  };

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

  protected readonly sceneView = computed<ObservatoryView>(() =>
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

  protected readonly currentRoute = computed(() => {
    const view = this.station.view();
    return pathOf(
      view === 'home' || view === 'about' ? view : 'index',
      this.locale.lang(),
    );
  });

  protected readonly showsRule = computed(
    () => this.station.view() === 'home' && this.station.preview() === null,
  );

  private landed = false;

  constructor() {
    inject(DisplayFormatService).publishOnRoot();
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

  protected onBodyClicked(slug: string): void {
    const view = this.station.view();
    if (view === 'index') {
      this.station.select(this.station.selected() === slug ? null : slug);
    } else if (view === 'home' && this.projects.isFeatured(slug)) {
      this.station.togglePreview(slug);
    }
  }

  protected onReaderHovered(slug: string | null): void {
    this.curtain.takeOver();
    this.station.hover(slug);
  }

  protected onVoid(): void {
    void this.station.stepBack();
  }

  private claimFocus(shown: ObservatoryWindow | null): () => void {
    return this.landing.claimWithin(() =>
      shown === null
        ? this.homeTitle()?.nativeElement
        : this.slotOf(shown).nativeElement,
    );
  }

  private slotOf(shown: ObservatoryWindow): ElementRef<HTMLElement> {
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
