import { defineUpdater } from 'ngx-statewise';
import {
  desktopChapterChosen,
  desktopFiltered,
  desktopHovered,
  desktopRouteSynced,
  desktopPartChosen,
  desktopPauseToggled,
  desktopPinToggled,
  desktopPreviewClosed,
  desktopPreviewOpened,
  desktopSelected,
  desktopWindowClosed,
} from './desktop.action';
import { DesktopView } from '../../models';
import { DesktopState } from './desktop.state';

/** The view and the sheet the station already shows. */
function isWhereTheReaderIs(
  state: DesktopState,
  view: DesktopView,
  slug: string | null,
): boolean {
  return (
    view === state.view() && (view === 'sheet' ? slug : null) === state.slug()
  );
}

/** The only place the station's state is written. */
export const desktopUpdater = defineUpdater(DesktopState, (on) => {
  on(desktopRouteSynced, (state, { view, slug }) => {
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

  on(desktopPinToggled, (state, window) => {
    state.pins.update((pins) => ({ ...pins, [window]: !pins[window] }));
  });

  // Close also unpins, from any address: an armed pin with no window to
  // carry its ✕ would bring the window back unasked.
  on(desktopWindowClosed, (state, window) => {
    state.pins.update((pins) => ({ ...pins, [window]: false }));
    if (window === 'preview') {
      state.preview.set(null);
    }
  });

  on(desktopSelected, (state, slug) => {
    state.selection.set(slug);
    state.hovered.set(null);
  });

  on(desktopFiltered, (state, family) => {
    state.family.set(family);
  });

  on(desktopChapterChosen, (state, chapter) => {
    state.chapter.set(Math.max(0, chapter));
  });

  on(desktopPartChosen, (state, part) => {
    state.part.set(Math.max(0, part));
  });

  on(desktopPreviewOpened, (state, slug) => {
    state.preview.set(slug);
    state.reading.set(slug);
    state.hovered.set(null);
  });

  on(desktopPreviewClosed, (state) => {
    state.preview.set(null);
  });

  on(desktopHovered, (state, slug) => {
    state.hovered.set(slug);
  });

  on(desktopPauseToggled, (state) => {
    state.paused.update((paused) => !paused);
  });
});
