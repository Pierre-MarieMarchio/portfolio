import { computed, inject, Injectable } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import { DesktopView, DesktopWindow } from '../../models';
import {
  desktopChapterChosen,
  desktopEscaped,
  desktopFiltered,
  desktopHovered,
  desktopPinToggled,
  desktopPreviewClosed,
  desktopPreviewOpened,
  desktopRouteSynced,
  desktopSectionChosen,
  desktopSelected,
  desktopSteppedBack,
  desktopWindowClosed,
} from './desktop.action';
import { DesktopState } from './desktop.state';
import { desktopUpdater } from './desktop.updater';
import { stepBack } from '../../rules/view.rules';

@Injectable({ providedIn: 'root' })
export class DesktopManager {
  private readonly state = inject(DesktopState);
  private readonly statewise = injectStatewise(desktopUpdater);

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

  public chooseSection(section: number): void {
    this.statewise.dispatch(desktopSectionChosen(section));
  }

  public togglePreview(slug: string): void {
    this.statewise.dispatch(
      this.preview() === slug
        ? desktopPreviewClosed()
        : desktopPreviewOpened(slug),
    );
  }

  public openPreview(slug: string): void {
    this.statewise.dispatch(desktopPreviewOpened(slug));
  }

  public hover(slug: string | null): void {
    this.statewise.dispatch(desktopHovered(slug));
  }
}
