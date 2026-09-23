import { defineUpdater } from 'ngx-statewise';
import {
  stationChapterChosen,
  stationFiltered,
  stationHovered,
  stationRouteSynced,
  stationPartChosen,
  stationPauseToggled,
  stationPinToggled,
  stationPreviewClosed,
  stationPreviewOpened,
  stationSelected,
  stationWindowClosed,
} from './station.action';
import { StationView } from '../../models';
import { StationState } from './station.state';

/** The view and the sheet the station already shows. */
function isWhereTheReaderIs(
  state: StationState,
  view: StationView,
  slug: string | null,
): boolean {
  return (
    view === state.view() && (view === 'sheet' ? slug : null) === state.slug()
  );
}

/** The only place the station's state is written. */
export const stationUpdater = defineUpdater(StationState, (on) => {
  on(stationRouteSynced, (state, { view, slug }) => {
    const previous = state.slug();
    // The same view at another address is the language switch (D3): the
    // reader has not moved, and nothing they set up is reset.
    if (isWhereTheReaderIs(state, view, slug)) {
      return;
    }
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
    state.part.set(Math.max(0, part));
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

  on(stationPauseToggled, (state) => {
    state.paused.update((paused) => !paused);
  });
});
