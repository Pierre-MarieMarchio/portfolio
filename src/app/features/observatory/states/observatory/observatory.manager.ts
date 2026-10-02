import { computed, inject, Service } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import { DisplayFormatService } from '@app/core/services';
import {
  MinimizableWindow,
  ObservatoryMinimized,
  ObservatoryView,
  ObservatoryWindow,
} from '../../models';
import {
  observatoryChapterChosen,
  observatoryEscaped,
  observatoryFiltered,
  observatoryHovered,
  observatoryPinToggled,
  observatoryPreviewClosed,
  observatoryPreviewOpened,
  observatoryRouteSynced,
  observatorySectionChosen,
  observatorySelected,
  observatorySteppedBack,
  observatoryWindowClosed,
  observatoryWindowMinimized,
  observatoryWindowPrepared,
  observatoryWindowsRestored,
} from './observatory.action';
import { NONE_MINIMIZED, ObservatoryState } from './observatory.state';
import { observatoryUpdater } from './observatory.updater';
import { dockedOf, keptOf, stepBack, windowOf } from '../../rules/view.rules';

@Service()
export class ObservatoryManager {
  private readonly state = inject(ObservatoryState);
  private readonly display = inject(DisplayFormatService);
  private readonly statewise = injectStatewise(observatoryUpdater);

  public readonly view = this.state.view.asReadonly();
  public readonly slug = this.state.slug.asReadonly();
  public readonly chapter = this.state.chapter.asReadonly();
  public readonly section = this.state.section.asReadonly();
  public readonly visited = this.state.visited.asReadonly();
  public readonly pins = this.state.pins.asReadonly();
  public readonly preview = this.state.preview.asReadonly();
  public readonly lastPreview = this.state.lastPreview.asReadonly();
  public readonly lastSheet = this.state.lastSheet.asReadonly();
  public readonly resume = this.state.resume.asReadonly();
  public readonly selected = this.state.selected.asReadonly();
  public readonly hovered = this.state.hovered.asReadonly();
  public readonly family = this.state.family.asReadonly();

  public readonly minimized = computed<ObservatoryMinimized>(() =>
    this.display.format() === 'phone' ? NONE_MINIMIZED : this.state.minimized(),
  );

  public readonly opensList = computed(
    () => this.view() === 'index' || this.pins().index,
  );
  public readonly opensAbout = computed(
    () => this.view() === 'about' || this.pins().about,
  );
  public readonly opensSheet = computed(
    () => windowOf(this.view()) === 'sheet' || this.pins().sheet,
  );
  public readonly showsList = computed(
    () => this.opensList() && !this.minimized().index,
  );
  public readonly showsAbout = computed(
    () => this.opensAbout() && !this.minimized().about,
  );
  public readonly showsSheet = computed(
    () => this.opensSheet() && !this.minimized().sheet,
  );
  public readonly kept = computed(() =>
    keptOf({
      view: this.view(),
      pins: this.pins(),
      seen: this.state.seen(),
    }),
  );
  public readonly showsPreview = computed(
    () =>
      this.preview() !== null &&
      (this.view() === 'home' || this.pins().preview),
  );
  public readonly shownPreview = computed(() =>
    this.showsPreview() ? this.preview() : null,
  );
  public readonly docked = computed(() =>
    dockedOf({
      view: this.view(),
      pins: this.pins(),
      preview: this.preview(),
      lastSheet: this.lastSheet(),
    }),
  );
  public readonly canStepBack = computed(
    () =>
      stepBack({
        view: this.view(),
        selection: this.selected(),
        preview: this.preview(),
      }) !== null,
  );

  public syncRoute(view: ObservatoryView, slug: string | null = null): void {
    this.statewise.dispatch(observatoryRouteSynced({ view, slug }));
  }

  public prepare(window: ObservatoryWindow): void {
    this.statewise.dispatch(observatoryWindowPrepared(window));
  }

  public togglePin(window: ObservatoryWindow): void {
    this.statewise.dispatch(observatoryPinToggled(window));
  }

  public minimize(window: MinimizableWindow): void {
    this.statewise.dispatch(observatoryWindowMinimized(window));
  }

  public restore(windows: readonly MinimizableWindow[]): void {
    this.statewise.dispatch(observatoryWindowsRestored(windows));
  }

  public close(window: ObservatoryWindow): Promise<void> {
    return this.statewise.dispatchAsync(observatoryWindowClosed(window));
  }

  public escape(): Promise<void> {
    return this.statewise.dispatchAsync(observatoryEscaped());
  }

  public stepBack(): Promise<void> {
    return this.statewise.dispatchAsync(observatorySteppedBack());
  }

  public select(slug: string | null): void {
    this.statewise.dispatch(observatorySelected(slug));
  }

  public filter(family: string): void {
    this.statewise.dispatch(observatoryFiltered(family));
  }

  public chooseChapter(chapter: number): void {
    this.statewise.dispatch(observatoryChapterChosen(chapter));
  }

  public chooseSection(section: number): void {
    this.statewise.dispatch(observatorySectionChosen(section));
  }

  public togglePreview(slug: string): void {
    this.statewise.dispatch(
      this.preview() === slug
        ? observatoryPreviewClosed()
        : observatoryPreviewOpened(slug),
    );
  }

  public openPreview(slug: string): void {
    this.statewise.dispatch(observatoryPreviewOpened(slug));
  }

  public closePreview(): void {
    this.statewise.dispatch(observatoryPreviewClosed());
  }

  public hover(slug: string | null): void {
    this.statewise.dispatch(observatoryHovered(slug));
  }
}
