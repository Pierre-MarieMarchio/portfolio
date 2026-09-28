import {
  afterNextRender,
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  untracked,
} from '@angular/core';
import {
  DisplayFormatService,
  FormatCodeService,
  LocaleService,
} from '@app/core/services';
import { SceneAnchorKind } from '@app/features/common';
import {
  AnimationToggleComponent,
  HomeTitleComponent,
  IntroCardComponent,
  NotFoundWindowComponent,
  ObservatoryDockComponent,
  ObservatorySceneComponent,
} from '@app/features/observatory/components';
import { ViewSlotDirective } from '@app/features/observatory/directives';
import {
  OBSERVATORY_IDS,
  ObservatoryView,
  Planet,
} from '@app/features/observatory/models';
import { OBSERVATORY_TEXTS } from '@app/features/observatory/ports';
import { viewAtAddress } from '@app/features/observatory/rules';
import {
  FeaturedTourService,
  HomeRevealService,
  ViewWindowsService,
} from '@app/features/observatory/services';
import {
  AnimationManager,
  ObservatoryManager,
} from '@app/features/observatory/states';
import {
  AboutWindowComponent,
  ContactLinksComponent,
} from '@app/features/profile/components';
import {
  FeaturedBarComponent,
  ProjectDetailComponent,
  ProjectListComponent,
  ProjectPreviewComponent,
} from '@app/features/projects/components';
import { FAMILIES, FamilyFilter } from '@app/features/projects/models';
import { restingPickOf } from '@app/features/projects/rules';
import { ProjectsManager } from '@app/features/projects/states';
import { pathOf, ViewLinksService } from '@app/i18n';
import {
  LanguageSwitchComponent,
  MainNavComponent,
} from '@shared/ui/components';
import {
  BottomEdgeVariableDirective,
  LayoutAnchorDirective,
} from '@shared/ui/directives';
import {
  KeptWindowDirective,
  loadGlassGestures,
  StackedWindowDirective,
} from '@shared/windows/directives';
import { WindowStackService } from '@shared/windows/services';

interface SheetOnShow {
  readonly slug: string | null;
  readonly chapter: number;
}

@Component({
  selector: 'app-observatory-page',
  imports: [
    AboutWindowComponent,
    AnimationToggleComponent,
    BottomEdgeVariableDirective,
    ContactLinksComponent,
    FeaturedBarComponent,
    HomeTitleComponent,
    IntroCardComponent,
    KeptWindowDirective,
    LanguageSwitchComponent,
    LayoutAnchorDirective,
    MainNavComponent,
    NotFoundWindowComponent,
    ObservatoryDockComponent,
    ObservatorySceneComponent,
    ProjectDetailComponent,
    ProjectListComponent,
    ProjectPreviewComponent,
    StackedWindowDirective,
    ViewSlotDirective,
  ],
  providers: [
    HomeRevealService,
    FeaturedTourService,
    WindowStackService,
    ViewWindowsService,
  ],
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  templateUrl: './observatory-page.component.html',
  styleUrl: './observatory-page.component.scss',
})
export class ObservatoryPageComponent {
  private readonly featuredTour = inject(FeaturedTourService);
  private readonly homeReveal = inject(HomeRevealService);
  protected readonly observatory = inject(ObservatoryManager);
  protected readonly animation = inject(AnimationManager);
  protected readonly projects = inject(ProjectsManager);
  protected readonly links = inject(ViewLinksService);
  protected readonly observatoryTexts = inject(OBSERVATORY_TEXTS);
  protected readonly ids = OBSERVATORY_IDS;
  protected readonly anchor: {
    readonly [K in Exclude<SceneAnchorKind, 'line'>]: K;
  } = {
    panel: 'panel',
    head: 'head',
    rule: 'rule',
    detail: 'detail',
    preview: 'preview',
    chrome: 'chrome',
  };

  protected readonly arrival = this.homeReveal.arrival;
  protected readonly isOpening = this.homeReveal.isOpening;

  protected readonly planets = computed<readonly Planet[]>(() =>
    this.projects
      .projects()
      .map(({ slug, title, short }) => ({ slug, title, short })),
  );

  protected readonly sheetSlug = computed(() => {
    const slug = this.observatory.slug();
    return slug && this.projects.find(slug) ? slug : null;
  });

  protected readonly isNotFound = computed(
    () =>
      this.observatory.view() === 'not-found' ||
      (this.observatory.view() === 'sheet' && this.sheetSlug() === null),
  );

  protected readonly sheet = linkedSignal<
    SheetOnShow & { readonly isShown: boolean },
    SheetOnShow
  >({
    source: () => ({
      isShown: this.observatory.showsSheet(),
      slug: this.isNotFound() ? null : this.sheetSlug(),
      chapter: this.observatory.chapter(),
    }),
    computation: ({ isShown, slug, chapter }, previous) =>
      isShown || !previous ? { slug, chapter } : previous.value,
  });

  protected readonly sceneView = computed<ObservatoryView>(() =>
    this.isNotFound() ? 'not-found' : this.observatory.view(),
  );

  protected readonly family = computed<FamilyFilter>(
    () =>
      FAMILIES.find((family) => family === this.observatory.family()) ?? 'all',
  );

  private readonly featuredSlugs = computed(() =>
    this.projects.featured().map((project) => project.slug),
  );

  protected readonly designated = computed(() =>
    restingPickOf(this.featuredSlugs(), this.observatory.lastPreview()),
  );

  protected readonly currentRoute = computed(() =>
    this.links.routeOf(this.observatory.view()),
  );

  protected readonly showsRule = computed(
    () =>
      this.observatory.view() === 'home' && this.observatory.preview() === null,
  );

  constructor() {
    const locale = inject(LocaleService);
    const lang = locale.lang();
    const loaded = viewAtAddress(locale.path(), (at) => pathOf(at, lang));
    this.observatory.syncRoute(loaded.view, loaded.slug);
    inject(DisplayFormatService).publishOnRoot();
    inject(FormatCodeService).load(['phone'], loadGlassGestures);
    const windows = inject(ViewWindowsService);
    effect(() => {
      if (this.arrival() === 'shown') {
        untracked(() => {
          windows.prepareWhenIdle();
        });
      }
    });
    afterNextRender(() => {
      this.homeReveal.start(() => {
        this.featuredTour.play(() => this.featuredSlugs());
      });
    });
  }

  protected onEscape(): void {
    void this.observatory.escape();
  }

  protected onBodyClicked(slug: string): void {
    const view = this.observatory.view();
    if (view === 'index') {
      this.observatory.select(
        this.observatory.selected() === slug ? null : slug,
      );
    } else if (view === 'home' && this.projects.isFeatured(slug)) {
      this.observatory.togglePreview(slug);
    }
  }

  protected onReaderHovered(slug: string | null): void {
    this.featuredTour.takeOver();
    this.observatory.hover(slug);
  }

  protected onVoid(): void {
    void this.observatory.stepBack();
  }
}
