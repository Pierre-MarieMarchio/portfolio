import { defineUpdater } from 'ngx-statewise';
import {
  stationChapterChosen,
  stationEnglishAsked,
  stationFiltered,
  stationHovered,
  stationNavigated,
  stationPartChosen,
  stationPauseToggled,
  stationPinToggled,
  stationPreviewClosed,
  stationPreviewOpened,
  stationSelected,
  stationWindowClosed,
} from './station.action';
import { StationState } from './station.state';

/** The only place the station's state is written. */
export const stationUpdater = defineUpdater(StationState, (on) => {
  on(stationNavigated, (state, { view, slug }) => {
    const previous = state.slug();
    state.view.set(view);
    state.slug.set(view === 'sheet' ? slug : null);
    // Every arrival starts a sheet from its first approach, and hovering
    // belongs to the view just left.
    state.chapter.set(0);
    state.hovered.set(null);
    // The preview only outlives the home page when it is pinned.
    if (!state.pins().preview) {
      state.preview.set(null);
    }
    if (view === 'sheet' && slug && !state.visited().includes(slug)) {
      state.visited.update((visited) => [...visited, slug]);
    }
    // Back from a sheet, the index opens on the row just read.
    if (view === 'index' && previous) {
      state.selection.set(previous);
    }
  });

  on(stationPinToggled, (state, window) => {
    state.pins.update((pins) => ({ ...pins, [window]: !pins[window] }));
  });

  // Close also unpins, from any address: an armed pin with no window to
  // carry its ✕ would bring the window back unasked.
  on(stationWindowClosed, (state, window) => {
    state.pins.update((pins) => ({ ...pins, [window]: false }));
    if (window === 'preview') {
      state.preview.set(null);
    }
  });

  on(stationSelected, (state, slug) => {
    state.selection.set(slug);
    state.hovered.set(null);
  });

  on(stationFiltered, (state, family) => {
    state.family.set(family);
  });

  on(stationChapterChosen, (state, chapter) => {
    state.chapter.set(Math.max(0, chapter));
  });

  on(stationPartChosen, (state, part) => {
    state.part.set(part);
  });

  on(stationPreviewOpened, (state, slug) => {
    state.preview.set(slug);
    state.reading.set(slug);
    state.hovered.set(null);
  });

  on(stationPreviewClosed, (state) => {
    state.preview.set(null);
  });

  on(stationHovered, (state, slug) => {
    state.hovered.set(slug);
  });

  on(stationEnglishAsked, (state) => {
    state.englishAsked.set(true);
  });

  on(stationPauseToggled, (state) => {
    state.paused.update((paused) => !paused);
  });
});
