import { defineSingleAction, emptyPayload, payload } from 'ngx-statewise';
import { DesktopView, DesktopWindow } from '../../models';

/** The address changed: the only writer of the view and its slug. */
export const desktopRouteSynced = defineSingleAction(
  'STATION_ROUTE_SYNCED',
  payload<{ view: DesktopView; slug: string | null }>(),
);

export const desktopPinToggled = defineSingleAction(
  'STATION_PIN_TOGGLED',
  payload<DesktopWindow>(),
);

/** Close means "I no longer need it": unpin, and step back if it was here. */
export const desktopWindowClosed = defineSingleAction(
  'STATION_WINDOW_CLOSED',
  payload<DesktopWindow>(),
);

/**
 * Escape steps back one notch, from every view. Kept apart from
 * `stationSteppedBack` on purpose: it reaches further (see `stepBack`).
 */
export const desktopEscaped = defineSingleAction(
  'STATION_ESCAPED',
  emptyPayload,
);

/** A click in the void steps back one notch, over what it covers. */
export const desktopSteppedBack = defineSingleAction(
  'STATION_STEPPED_BACK',
  emptyPayload,
);

export const desktopSelected = defineSingleAction(
  'STATION_SELECTED',
  payload<string | null>(),
);

export const desktopFiltered = defineSingleAction(
  'STATION_FILTERED',
  payload<string>(),
);

export const desktopChapterChosen = defineSingleAction(
  'STATION_CHAPTER_CHOSEN',
  payload<number>(),
);

export const desktopPartChosen = defineSingleAction(
  'STATION_PART_CHOSEN',
  payload<number>(),
);

export const desktopPreviewOpened = defineSingleAction(
  'STATION_PREVIEW_OPENED',
  payload<string>(),
);

export const desktopPreviewClosed = defineSingleAction(
  'STATION_PREVIEW_CLOSED',
  emptyPayload,
);

export const desktopHovered = defineSingleAction(
  'STATION_HOVERED',
  payload<string | null>(),
);

export const desktopPauseToggled = defineSingleAction(
  'STATION_PAUSE_TOGGLED',
  emptyPayload,
);
