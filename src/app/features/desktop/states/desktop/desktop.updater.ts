import { defineUpdater } from 'ngx-statewise';
import {
  desktopChapterChosen,
  desktopFiltered,
  desktopHovered,
  desktopPinToggled,
  desktopPreviewClosed,
  desktopPreviewOpened,
  desktopRouteSynced,
  desktopSectionChosen,
  desktopSelected,
  desktopWindowClosed,
} from './desktop.action';
import { DesktopView } from '../../models';
import { DesktopState } from './desktop.state';

function isWhereTheReaderIs(
  state: DesktopState,
  view: DesktopView,
  slug: string | null,
): boolean {
  return (
    view === state.view() && (view === 'sheet' ? slug : null) === state.slug()
  );
}

export const desktopUpdater = defineUpdater(DesktopState, (on) => {
  on(desktopRouteSynced, (state, { view, slug }) => {
    const previous = state.slug();
    if (isWhereTheReaderIs(state, view, slug)) {
      return;
    }
    state.view.set(view);
    state.slug.set(view === 'sheet' ? slug : null);
    state.chapter.set(0);
    state.hovered.set(null);
    if (!state.pins().preview) {
      state.preview.set(null);
    }
    if (view === 'sheet' && slug && !state.visited().includes(slug)) {
      state.visited.update((visited) => [...visited, slug]);
    }
    if (view === 'index' && previous) {
      state.selected.set(previous);
    }
  });

  on(desktopPinToggled, (state, window) => {
    state.pins.update((pins) => ({ ...pins, [window]: !pins[window] }));
  });

  on(desktopWindowClosed, (state, window) => {
    state.pins.update((pins) => ({ ...pins, [window]: false }));
    if (window === 'preview') {
      state.preview.set(null);
    }
  });

  on(desktopSelected, (state, slug) => {
    state.selected.set(slug);
    state.hovered.set(null);
  });

  on(desktopFiltered, (state, family) => {
    state.family.set(family);
  });

  on(desktopChapterChosen, (state, chapter) => {
    state.chapter.set(Math.max(0, chapter));
  });

  on(desktopSectionChosen, (state, section) => {
    state.section.set(Math.max(0, section));
  });

  on(desktopPreviewOpened, (state, slug) => {
    state.preview.set(slug);
    state.lastPreview.set(slug);
    state.hovered.set(null);
  });

  on(desktopPreviewClosed, (state) => {
    state.preview.set(null);
  });

  on(desktopHovered, (state, slug) => {
    state.hovered.set(slug);
  });
});
