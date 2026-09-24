import { defineUpdater } from 'ngx-statewise';
import {
  observatoryChapterChosen,
  observatoryFiltered,
  observatoryHovered,
  observatoryPinToggled,
  observatoryPreviewClosed,
  observatoryPreviewOpened,
  observatoryRouteSynced,
  observatorySectionChosen,
  observatorySelected,
  observatoryWindowClosed,
} from './observatory.action';
import { ObservatoryView } from '../../models';
import { ObservatoryState } from './observatory.state';

function isWhereTheReaderIs(
  state: ObservatoryState,
  view: ObservatoryView,
  slug: string | null,
): boolean {
  return (
    view === state.view() && (view === 'sheet' ? slug : null) === state.slug()
  );
}

export const observatoryUpdater = defineUpdater(ObservatoryState, (on) => {
  on(observatoryRouteSynced, (state, { view, slug }) => {
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
    if (view === 'sheet' && slug) {
      state.lastSheet.set(slug);
      if (!state.visited().includes(slug)) {
        state.visited.update((visited) => [...visited, slug]);
      }
    }
    if (view === 'index' && previous) {
      state.selected.set(previous);
    }
  });

  on(observatoryPinToggled, (state, window) => {
    state.pins.update((pins) => ({ ...pins, [window]: !pins[window] }));
  });

  on(observatoryWindowClosed, (state, window) => {
    state.pins.update((pins) => ({ ...pins, [window]: false }));
    if (window === 'preview') {
      state.preview.set(null);
    }
  });

  on(observatorySelected, (state, slug) => {
    state.selected.set(slug);
    state.hovered.set(null);
  });

  on(observatoryFiltered, (state, family) => {
    state.family.set(family);
  });

  on(observatoryChapterChosen, (state, chapter) => {
    state.chapter.set(Math.max(0, chapter));
  });

  on(observatorySectionChosen, (state, section) => {
    state.section.set(Math.max(0, section));
  });

  on(observatoryPreviewOpened, (state, slug) => {
    state.preview.set(slug);
    state.lastPreview.set(slug);
    state.hovered.set(null);
  });

  on(observatoryPreviewClosed, (state) => {
    state.preview.set(null);
  });

  on(observatoryHovered, (state, slug) => {
    state.hovered.set(slug);
  });
});
