import { computed, inject, Injectable } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import { StationView, StationWindow } from '../../models';
import {
  stationChapterChosen,
  stationEnglishAsked,
  stationEscaped,
  stationFiltered,
  stationHovered,
  stationNavigated,
  stationPartChosen,
  stationPauseToggled,
  stationPinToggled,
  stationPreviewClosed,
  stationPreviewOpened,
  stationSelected,
  stationVoidClicked,
  stationWindowClosed,
} from './station.action';
import { StationState } from './station.state';
import { stationUpdater } from './station.updater';

/** The only API the composition sees of the station. */
@Injectable({ providedIn: 'root' })
export class StationManager {
  private readonly state = inject(StationState);
  private readonly statewise = injectStatewise(stationUpdater);

  public readonly view = this.state.view.asReadonly();
  public readonly slug = this.state.slug.asReadonly();
  public readonly pins = this.state.pins.asReadonly();
  public readonly preview = this.state.preview.asReadonly();
  public readonly selection = this.state.selection.asReadonly();
  public readonly visited = this.state.visited.asReadonly();
  public readonly family = this.state.family.asReadonly();
  public readonly chapter = this.state.chapter.asReadonly();
  public readonly part = this.state.part.asReadonly();
  public readonly hovered = this.state.hovered.asReadonly();
  public readonly englishAsked = this.state.englishAsked.asReadonly();
  public readonly paused = this.state.paused.asReadonly();

  /** A window shows on its own address, or anywhere once pinned. */
  public readonly showsIndex = computed(
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

  public navigated(view: StationView, slug: string | null = null): void {
    this.statewise.dispatch(stationNavigated({ view, slug }));
  }

  public togglePin(window: StationWindow): void {
    this.statewise.dispatch(stationPinToggled(window));
  }

  public close(window: StationWindow): Promise<void> {
    return this.statewise.dispatchAsync(stationWindowClosed(window));
  }

  public escape(): Promise<void> {
    return this.statewise.dispatchAsync(stationEscaped());
  }

  public clickVoid(): Promise<void> {
    return this.statewise.dispatchAsync(stationVoidClicked());
  }

  public select(slug: string | null): void {
    this.statewise.dispatch(stationSelected(slug));
  }

  public filter(family: string): void {
    this.statewise.dispatch(stationFiltered(family));
  }

  public chooseChapter(chapter: number): void {
    this.statewise.dispatch(stationChapterChosen(chapter));
  }

  public choosePart(part: string): void {
    this.statewise.dispatch(stationPartChosen(part));
  }

  /** A second open on the project already shown closes the preview. */
  public togglePreview(slug: string): void {
    this.statewise.dispatch(
      this.preview() === slug
        ? stationPreviewClosed()
        : stationPreviewOpened(slug),
    );
  }

  /** From the preview's own selector: change body in place, never close. */
  public showPreview(slug: string): void {
    this.statewise.dispatch(stationPreviewOpened(slug));
  }

  public hover(slug: string | null): void {
    this.statewise.dispatch(stationHovered(slug));
  }

  public askEnglish(): void {
    this.statewise.dispatch(stationEnglishAsked());
  }

  public togglePause(): void {
    this.statewise.dispatch(stationPauseToggled());
  }
}
