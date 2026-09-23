import { computed, inject, Injectable } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import { StationView, StationWindow } from '../../models';
import {
  stationChapterChosen,
  stationEnglishAsked,
  stationEscaped,
  stationFiltered,
  stationHovered,
  stationRouteSynced,
  stationPartChosen,
  stationPauseToggled,
  stationPinToggled,
  stationPreviewClosed,
  stationPreviewOpened,
  stationSelected,
  stationSteppedBack,
  stationWindowClosed,
} from './station.action';
import { StationState } from './station.state';
import { stationUpdater } from './station.updater';
import { stepBack } from './step-back';

/** The only API the composition sees of the station. */
@Injectable({ providedIn: 'root' })
export class StationManager {
  private readonly state = inject(StationState);
  private readonly statewise = injectStatewise(stationUpdater);

  public readonly view = this.state.view.asReadonly();
  public readonly slug = this.state.slug.asReadonly();
  public readonly pins = this.state.pins.asReadonly();
  public readonly preview = this.state.preview.asReadonly();
  public readonly reading = this.state.reading.asReadonly();
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

  /**
   * Whether a click in the void has something to close: the void button is
   * drawn only then. The effect reads the same rule to decide what it does.
   */
  public readonly canStepBack = computed(
    () =>
      stepBack('void', {
        view: this.view(),
        selection: this.selection(),
        preview: this.preview(),
      }) !== null,
  );

  /** The router says where the reader is; only a route marker calls this. */
  public syncRoute(view: StationView, slug: string | null = null): void {
    this.statewise.dispatch(stationRouteSynced({ view, slug }));
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

  /** One notch back, over what the void covers (see `canStepBack`). */
  public stepBack(): Promise<void> {
    return this.statewise.dispatchAsync(stationSteppedBack());
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

  public choosePart(part: number): void {
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
  public openPreview(slug: string): void {
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
