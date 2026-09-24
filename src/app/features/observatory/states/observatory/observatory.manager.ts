import { computed, inject, Service } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import { ObservatoryView, ObservatoryWindow } from '../../models';
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
} from './observatory.action';
import { ObservatoryState } from './observatory.state';
import { observatoryUpdater } from './observatory.updater';
import { stepBack } from '../../rules/view.rules';

@Service()
export class ObservatoryManager {
  private readonly state = inject(ObservatoryState);
  private readonly statewise = injectStatewise(observatoryUpdater);

  public readonly view = this.state.view.asReadonly();
  public readonly slug = this.state.slug.asReadonly();
  public readonly chapter = this.state.chapter.asReadonly();
  public readonly section = this.state.section.asReadonly();
  public readonly visited = this.state.visited.asReadonly();
  public readonly pins = this.state.pins.asReadonly();
  public readonly preview = this.state.preview.asReadonly();
  public readonly lastPreview = this.state.lastPreview.asReadonly();
  public readonly selected = this.state.selected.asReadonly();
  public readonly hovered = this.state.hovered.asReadonly();
  public readonly family = this.state.family.asReadonly();

  public readonly showsList = computed(
    () => this.view() === 'index' || this.pins().index,
  );
  public readonly showsAbout = computed(
    () => this.view() === 'about' || this.pins().about,
  );
  public readonly showsPreview = computed(
    () =>
      this.preview() !== null &&
      (this.view() === 'home' || this.pins().preview),
  );
  public readonly canStepBack = computed(
    () =>
      stepBack('void', {
        view: this.view(),
        selection: this.selected(),
        preview: this.preview(),
      }) !== null,
  );

  public syncRoute(view: ObservatoryView, slug: string | null = null): void {
    this.statewise.dispatch(observatoryRouteSynced({ view, slug }));
  }

  public togglePin(window: ObservatoryWindow): void {
    this.statewise.dispatch(observatoryPinToggled(window));
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

  public hover(slug: string | null): void {
    this.statewise.dispatch(observatoryHovered(slug));
  }
}
