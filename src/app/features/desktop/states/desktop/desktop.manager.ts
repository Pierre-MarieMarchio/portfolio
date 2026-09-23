import { computed, inject, Injectable } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import { DesktopView, DesktopWindow } from '../../models';
import {
  desktopChapterChosen,
  desktopEscaped,
  desktopFiltered,
  desktopHovered,
  desktopRouteSynced,
  desktopPartChosen,
  desktopPauseToggled,
  desktopPinToggled,
  desktopPreviewClosed,
  desktopPreviewOpened,
  desktopSelected,
  desktopSteppedBack,
  desktopWindowClosed,
} from './desktop.action';
import { DesktopState } from './desktop.state';
import { desktopUpdater } from './desktop.updater';
import { stepBack } from '../../rules/view.rules';

/** The only API the composition sees of the station. */
@Injectable({ providedIn: 'root' })
export class DesktopManager {
  private readonly state = inject(DesktopState);
  private readonly statewise = injectStatewise(desktopUpdater);

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
  public syncRoute(view: DesktopView, slug: string | null = null): void {
    this.statewise.dispatch(desktopRouteSynced({ view, slug }));
  }

  public togglePin(window: DesktopWindow): void {
    this.statewise.dispatch(desktopPinToggled(window));
  }

  public close(window: DesktopWindow): Promise<void> {
    return this.statewise.dispatchAsync(desktopWindowClosed(window));
  }

  public escape(): Promise<void> {
    return this.statewise.dispatchAsync(desktopEscaped());
  }

  /** One notch back, over what the void covers (see `canStepBack`). */
  public stepBack(): Promise<void> {
    return this.statewise.dispatchAsync(desktopSteppedBack());
  }

  public select(slug: string | null): void {
    this.statewise.dispatch(desktopSelected(slug));
  }

  public filter(family: string): void {
    this.statewise.dispatch(desktopFiltered(family));
  }

  public chooseChapter(chapter: number): void {
    this.statewise.dispatch(desktopChapterChosen(chapter));
  }

  public choosePart(part: number): void {
    this.statewise.dispatch(desktopPartChosen(part));
  }

  /** A second open on the project already shown closes the preview. */
  public togglePreview(slug: string): void {
    this.statewise.dispatch(
      this.preview() === slug
        ? desktopPreviewClosed()
        : desktopPreviewOpened(slug),
    );
  }

  /** From the preview's own selector: change body in place, never close. */
  public openPreview(slug: string): void {
    this.statewise.dispatch(desktopPreviewOpened(slug));
  }

  public hover(slug: string | null): void {
    this.statewise.dispatch(desktopHovered(slug));
  }

  public togglePause(): void {
    this.statewise.dispatch(desktopPauseToggled());
  }
}
