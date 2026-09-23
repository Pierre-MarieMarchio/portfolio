import { defineSingleAction, emptyPayload, payload } from 'ngx-statewise';
import { DesktopView, DesktopWindow } from '../../models';

export const desktopRouteSynced = defineSingleAction(
  'DESKTOP_ROUTE_SYNCED',
  payload<{ view: DesktopView; slug: string | null }>(),
);

export const desktopPinToggled = defineSingleAction(
  'DESKTOP_PIN_TOGGLED',
  payload<DesktopWindow>(),
);

export const desktopWindowClosed = defineSingleAction(
  'DESKTOP_WINDOW_CLOSED',
  payload<DesktopWindow>(),
);

export const desktopEscaped = defineSingleAction(
  'DESKTOP_ESCAPED',
  emptyPayload,
);

export const desktopSteppedBack = defineSingleAction(
  'DESKTOP_STEPPED_BACK',
  emptyPayload,
);

export const desktopSelected = defineSingleAction(
  'DESKTOP_SELECTED',
  payload<string | null>(),
);

export const desktopFiltered = defineSingleAction(
  'DESKTOP_FILTERED',
  payload<string>(),
);

export const desktopChapterChosen = defineSingleAction(
  'DESKTOP_CHAPTER_CHOSEN',
  payload<number>(),
);

export const desktopSectionChosen = defineSingleAction(
  'DESKTOP_SECTION_CHOSEN',
  payload<number>(),
);

export const desktopPreviewOpened = defineSingleAction(
  'DESKTOP_PREVIEW_OPENED',
  payload<string>(),
);

export const desktopPreviewClosed = defineSingleAction(
  'DESKTOP_PREVIEW_CLOSED',
  emptyPayload,
);

export const desktopHovered = defineSingleAction(
  'DESKTOP_HOVERED',
  payload<string | null>(),
);
