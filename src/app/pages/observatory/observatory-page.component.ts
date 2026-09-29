import {
  afterNextRender,
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  untracked,
  viewChildren,
} from '@angular/core';
import { DisplayFormatService, LocaleService } from '@app/core/services';
import { SceneAnchorKind } from '@app/features/common';
import {
  AnimationToggleComponent,
  HomeTitleComponent,
  IntroCardComponent,
  NotFoundWindowComponent,
  ObservatoryDockComponent,
  ObservatorySceneComponent,
} from '@app/features/observatory/components';
import {
  ViewSlotDirective,
  WindowSheetDirective,
} from '@app/features/observatory/directives';
import {
  OBSERVATORY_IDS,
  ObservatoryView,
  ObservatoryWindow,
  Planet,
} from '@app/features/observatory/models';
import { OBSERVATORY_TEXTS } from '@app/features/observatory/ports';
import { closeTargetOf, viewAtAddress } from '@app/features/observatory/rules';
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
import { BottomSheetComponent } from '@shared/mobile-nav/components';
import type { SheetDetent } from '@shared/mobile-nav/models';
import type { LayoutBox } from '@shared/space-scene/models';
import { SCENE_WINDOW_DRAG, SceneWindowDrag } from '@shared/space-scene/ports';
import type { FrameRect } from '@shared/windows/models';
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
  StackedWindowDirective,
  WindowFrameDirective,
} from '@shared/windows/directives';
import { WindowStackService } from '@shared/windows/services';

const PREVIEW_DETENTS: readonly SheetDetent[] = ['folded', 'half'];

const boxOf = (rect: FrameRect): LayoutBox => ({
  left: rect.x,
  top: rect.y,
  right: rect.x + rect.width,
  bottom: rect.y + rect.height,
});

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
    BottomSheetComponent,
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
    WindowFrameDirective,
    ViewSlotDirective,
    WindowSheetDirective,
  ],
  providers: [
    HomeRevealService,
    FeaturedTourService,
    WindowStackService,
    ViewWindowsService,
    { provide: SCENE_WINDOW_DRAG, useExisting: ObservatoryPageComponent },
  ],
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  templateUrl: './observatory-page.component.html',
  styleUrl: './observatory-page.component.scss',
})
export class ObservatoryPageComponent implements SceneWindowDrag {
  private readonly framedWindows = viewChildren(WindowFrameDirective);
  private readonly featuredTour = inject(FeaturedTourService);
  private readonly homeReveal = inject(HomeRevealService);
  protected readonly observatory = inject(ObservatoryManager);
  protected readonly animation = inject(AnimationManager);
  protected readonly projects = inject(ProjectsManager);
  protected readonly links = inject(ViewLinksService);
  protected readonly observatoryTexts = inject(OBSERVATORY_TEXTS);
  protected readonly ids = OBSERVATORY_IDS;
  protected readonly previewDetents = PREVIEW_DETENTS;
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

  protected readonly openRoutes = computed<readonly string[]>(() => {
    const routes: string[] = [];
    if (this.observatory.showsAbout()) {
      routes.push(this.links.routeOf('about'));
    }
    if (this.observatory.showsList() || this.observatory.showsSheet()) {
      routes.push(this.links.routeOf('index'));
    }
    return routes;
  });

  protected readonly closeLabels = computed(() => {
    const view = this.observatory.view();
    const { closeTo } = this.observatoryTexts();
    const labelOf = (window: ObservatoryWindow): string => {
      const target = closeTargetOf(window, view);
      return target === null ? '' : closeTo[target];
    };
    return {
      about: labelOf('about'),
      index: labelOf('index'),
      sheet: labelOf('sheet'),
    };
  });

  protected readonly showsRule = computed(
    () =>
      this.observatory.view() === 'home' && this.observatory.preview() === null,
  );

  protected readonly canDeselect = computed(
    () =>
      this.observatory.view() === 'index' &&
      this.observatory.selected() !== null,
  );

  protected readonly voidLabel = computed(() => {
    const { stepBack } = this.observatoryTexts();
    return this.canDeselect() ? stepBack.deselect : stepBack.closePreview;
  });

  constructor() {
    const locale = inject(LocaleService);
    const lang = locale.lang();
    const loaded = viewAtAddress(locale.path(), (at) => pathOf(at, lang));
    this.observatory.syncRoute(loaded.view, loaded.slug);
    inject(DisplayFormatService).publishOnRoot();
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

  public onDragging(handler: (rect: LayoutBox | null) => void): () => void {
    const stops = this.framedWindows().map((framed) =>
      framed.onLive((rect) => handler(rect && boxOf(rect))),
    );
    return () => {
      for (const stop of stops) {
        stop();
      }
    };
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
