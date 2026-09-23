import { defineSingleAction, emptyPayload, payload } from 'ngx-statewise';
import { StationView, StationWindow } from '../../models';

/** The address changed: the only writer of the view and its slug. */
export const stationRouteSynced = defineSingleAction(
  'STATION_ROUTE_SYNCED',
  payload<{ view: StationView; slug: string | null }>(),
);

export const stationPinToggled = defineSingleAction(
  'STATION_PIN_TOGGLED',
  payload<StationWindow>(),
);

/** Close means "I no longer need it": unpin, and step back if it was here. */
export const stationWindowClosed = defineSingleAction(
  'STATION_WINDOW_CLOSED',
  payload<StationWindow>(),
);

/**
 * Escape steps back one notch, from every view. Kept apart from
 * `stationSteppedBack` on purpose: it reaches further (see `stepBack`).
 */
export const stationEscaped = defineSingleAction(
  'STATION_ESCAPED',
  emptyPayload,
);

/** A click in the void steps back one notch, over what it covers. */
export const stationSteppedBack = defineSingleAction(
  'STATION_STEPPED_BACK',
  emptyPayload,
);

export const stationSelected = defineSingleAction(
  'STATION_SELECTED',
  payload<string | null>(),
);

export const stationFiltered = defineSingleAction(
  'STATION_FILTERED',
  payload<string>(),
);

export const stationChapterChosen = defineSingleAction(
  'STATION_CHAPTER_CHOSEN',
  payload<number>(),
);

export const stationPartChosen = defineSingleAction(
  'STATION_PART_CHOSEN',
  payload<number>(),
);

export const stationPreviewOpened = defineSingleAction(
  'STATION_PREVIEW_OPENED',
  payload<string>(),
);

export const stationPreviewClosed = defineSingleAction(
  'STATION_PREVIEW_CLOSED',
  emptyPayload,
);

export const stationHovered = defineSingleAction(
  'STATION_HOVERED',
  payload<string | null>(),
);

export const stationPauseToggled = defineSingleAction(
  'STATION_PAUSE_TOGGLED',
  emptyPayload,
);
