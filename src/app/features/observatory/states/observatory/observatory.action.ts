import { defineSingleAction, emptyPayload, payload } from 'ngx-statewise';
import {
  MinimizableWindow,
  ObservatoryView,
  ObservatoryWindow,
} from '../../models';

export const observatoryRouteSynced = defineSingleAction(
  'OBSERVATORY_ROUTE_SYNCED',
  payload<{
    view: ObservatoryView;
    slug: string | null;
    canHoldSheets?: boolean;
  }>(),
);

export const observatoryPinToggled = defineSingleAction(
  'OBSERVATORY_PIN_TOGGLED',
  payload<ObservatoryWindow>(),
);

export const observatoryWindowMinimized = defineSingleAction(
  'OBSERVATORY_WINDOW_MINIMIZED',
  payload<MinimizableWindow>(),
);

export const observatoryWindowsRestored = defineSingleAction(
  'OBSERVATORY_WINDOWS_RESTORED',
  payload<readonly MinimizableWindow[]>(),
);

export const observatoryWindowClosed = defineSingleAction(
  'OBSERVATORY_WINDOW_CLOSED',
  payload<ObservatoryWindow>(),
);

export const observatoryEscaped = defineSingleAction(
  'OBSERVATORY_ESCAPED',
  emptyPayload,
);

export const observatorySteppedBack = defineSingleAction(
  'OBSERVATORY_STEPPED_BACK',
  emptyPayload,
);

export const observatorySelected = defineSingleAction(
  'OBSERVATORY_SELECTED',
  payload<string | null>(),
);

export const observatoryFiltered = defineSingleAction(
  'OBSERVATORY_FILTERED',
  payload<string>(),
);

export const observatoryChapterChosen = defineSingleAction(
  'OBSERVATORY_CHAPTER_CHOSEN',
  payload<number>(),
);

export const observatorySectionChosen = defineSingleAction(
  'OBSERVATORY_SECTION_CHOSEN',
  payload<number>(),
);

export const observatoryPreviewOpened = defineSingleAction(
  'OBSERVATORY_PREVIEW_OPENED',
  payload<string>(),
);

export const observatoryPreviewClosed = defineSingleAction(
  'OBSERVATORY_PREVIEW_CLOSED',
  emptyPayload,
);

export const observatoryHovered = defineSingleAction(
  'OBSERVATORY_HOVERED',
  payload<string | null>(),
);

export const observatoryWindowPrepared = defineSingleAction(
  'OBSERVATORY_WINDOW_PREPARED',
  payload<ObservatoryWindow>(),
);

export const observatoryHeldSheetClosed = defineSingleAction(
  'OBSERVATORY_HELD_SHEET_CLOSED',
  payload<number>(),
);

export const observatoryHeldSheetEdited = defineSingleAction(
  'OBSERVATORY_HELD_SHEET_EDITED',
  payload<{ key: number; minimized?: boolean; chapter?: number }>(),
);
