import { defineUpdater } from 'ngx-statewise';
import {
  observatoryChapterChosen,
  observatoryHeldSheetClosed,
  observatoryHeldSheetEdited,
  observatoryFiltered,
  observatoryHovered,
  observatoryPinToggled,
  observatoryPreviewClosed,
  observatoryPreviewOpened,
  observatoryRouteSynced,
  observatorySectionChosen,
  observatorySelected,
  observatoryWindowClosed,
  observatoryWindowMinimized,
  observatoryWindowPrepared,
  observatoryWindowsRestored,
} from './observatory.action';
import {
  MinimizableWindow,
  ObservatoryView,
  ObservatoryWindow,
} from '../../models';
import { ObservatoryState } from './observatory.state';
import { handOverSheet } from '../../rules/sheet-windows.rules';
import { windowOf } from '../../rules/view.rules';

function see(state: ObservatoryState, window: ObservatoryWindow | null): void {
  if (window && !state.seen().includes(window)) {
    state.seen.update((seen) => [...seen, window]);
  }
}

function read(state: ObservatoryState, slug: string): void {
  state.lastSheet.set(slug);
  if (!state.visited().includes(slug)) {
    state.visited.update((visited) => [...visited, slug]);
  }
}

function isWhereTheReaderIs(
  state: ObservatoryState,
  view: ObservatoryView,
  slug: string | null,
): boolean {
  return (
    view === state.view() && (view === 'sheet' ? slug : null) === state.slug()
  );
}

function chapterOnArrival(
  state: ObservatoryState,
  view: ObservatoryView,
  slug: string | null,
): number {
  const resumed = state.resume();
  if (view !== 'sheet') {
    return state.pins().sheet ? state.chapter() : 0;
  }
  return slug !== null && resumed?.slug === slug ? resumed.chapter : 0;
}

function handOverSheets(
  state: ObservatoryState,
  view: ObservatoryView,
  slug: string | null,
  canHoldSheets: boolean,
): number | null {
  if (!canHoldSheets || view !== 'sheet' || !slug) {
    return null;
  }
  const next = handOverSheet(
    {
      key: state.sheetKey(),
      held: state.held(),
      slug: state.lastSheet(),
      chapter: state.chapter(),
      isPinned: state.pins().sheet,
      isMinimized: state.minimized().sheet,
    },
    slug,
  );
  if (next.key !== state.sheetKey()) {
    state.sheetKey.set(next.key);
    state.held.set(next.held);
    state.pins.update((pins) => ({ ...pins, sheet: next.chapter !== null }));
    state.minimized.update((minimized) => ({ ...minimized, sheet: false }));
  }
  return next.chapter;
}

function keepMinimizedPinned(state: ObservatoryState): void {
  const open = windowOf(state.view());
  const isStillMinimized = (window: MinimizableWindow): boolean =>
    state.minimized()[window] && state.pins()[window] && open !== window;
  state.minimized.set({
    index: isStillMinimized('index'),
    sheet: isStillMinimized('sheet'),
    about: isStillMinimized('about'),
  });
}

function noteArrival(
  state: ObservatoryState,
  view: ObservatoryView,
  slug: string | null,
  previous: string | null,
): void {
  if (view === 'sheet' && slug) {
    read(state, slug);
  } else if (view === 'index') {
    state.resume.set(null);
    if (previous) {
      state.selected.set(previous);
    }
  }
}

function syncRoute(
  state: ObservatoryState,
  view: ObservatoryView,
  slug: string | null,
  canHoldSheets: boolean,
): void {
  const previous = state.slug();
  if (isWhereTheReaderIs(state, view, slug)) {
    return;
  }
  if (state.view() === 'sheet' && previous) {
    state.resume.set({ slug: previous, chapter: state.chapter() });
  }
  const pulledChapter = handOverSheets(state, view, slug, canHoldSheets);
  state.view.set(view);
  state.slug.set(view === 'sheet' ? slug : null);
  state.chapter.set(pulledChapter ?? chapterOnArrival(state, view, slug));
  state.hovered.set(null);
  keepMinimizedPinned(state);
  see(state, windowOf(view));
  if (!state.pins().preview) {
    state.preview.set(null);
  }
  noteArrival(state, view, slug, previous);
}

function restoreWindows(
  state: ObservatoryState,
  windows: readonly MinimizableWindow[],
): undefined {
  state.minimized.update((minimized) => ({
    index: minimized.index && !windows.includes('index'),
    sheet: minimized.sheet && !windows.includes('sheet'),
    about: minimized.about && !windows.includes('about'),
  }));
  if (windows.includes('sheet')) {
    state.held.update((held) =>
      held.map((sheet) => ({ ...sheet, minimized: false })),
    );
  }
}

function closeHeldSheet(state: ObservatoryState, key: number): undefined {
  state.held.update((held) => held.filter((sheet) => sheet.key !== key));
}

function editHeldSheet(
  state: ObservatoryState,
  { key, ...edit }: { key: number; minimized?: boolean; chapter?: number },
): undefined {
  state.held.update((held) =>
    held.map((sheet) => (sheet.key === key ? { ...sheet, ...edit } : sheet)),
  );
}

function closeWindow(
  state: ObservatoryState,
  window: ObservatoryWindow,
): undefined {
  state.pins.update((pins) => ({ ...pins, [window]: false }));
  if (window === 'preview') {
    state.preview.set(null);
  } else {
    state.minimized.update((minimized) => ({ ...minimized, [window]: false }));
  }
}

function openPreview(state: ObservatoryState, slug: string): undefined {
  state.preview.set(slug);
  state.lastPreview.set(slug);
  state.hovered.set(null);
}

export const observatoryUpdater = defineUpdater(ObservatoryState, (on) => {
  on(observatoryRouteSynced, (state, { view, slug, canHoldSheets = false }) => {
    syncRoute(state, view, slug, canHoldSheets);
  });

  on(observatoryWindowPrepared, (state, window) => {
    see(state, window);
  });

  on(observatoryPinToggled, (state, window) => {
    state.pins.update((pins) => ({ ...pins, [window]: !pins[window] }));
  });

  on(observatoryWindowMinimized, (state, window) => {
    state.minimized.update((minimized) => ({ ...minimized, [window]: true }));
  });

  on(observatoryWindowsRestored, restoreWindows);

  on(observatoryWindowClosed, closeWindow);

  on(observatoryHeldSheetClosed, closeHeldSheet);

  on(observatoryHeldSheetEdited, editHeldSheet);

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

  on(observatoryPreviewOpened, openPreview);

  on(observatoryPreviewClosed, (state) => {
    state.preview.set(null);
  });

  on(observatoryHovered, (state, slug) => {
    state.hovered.set(slug);
  });
});
