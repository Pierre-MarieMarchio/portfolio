import { clamp } from '@app/core/helpers';
import type { EngineInputs } from '../../../engine/space-scene.engine';

export interface PlanetFocus {
  hovered: number;
  active: number;
  isOpen: boolean;
  isMap: boolean;
  isIndex: boolean;
  isOnSheet: boolean;
  read: number;
  selected: number;
  featured: number;
  shown: number;
  clock: number;
}

export interface PlanetBody {
  index: number;
  sx: number;
  sy: number;
  radius: number;
  shadow: number;
  isShaded: boolean;
  isCold: boolean;
  isLively: boolean;
  isCovered: boolean;
  rising: number;
  coverFade: number;
}

export const noFocus = (): PlanetFocus => ({
  hovered: -1,
  active: -1,
  isOpen: false,
  isMap: false,
  isIndex: false,
  isOnSheet: false,
  read: -1,
  selected: -1,
  featured: 0,
  shown: 0,
  clock: 0,
});

export const areMarksShown = (inputs: EngineInputs): boolean =>
  (inputs.view === 'home' && inputs.revealed) ||
  inputs.view === 'index' ||
  inputs.view === 'sheet';

// Home shows the selection, the index shows the whole system: one
// scene, two scales of reading.
export const focusOn = (
  focus: PlanetFocus,
  inputs: EngineInputs,
  count: number,
  marksTime: number,
): void => {
  const view = inputs.view;
  focus.hovered = inputs.hovered;
  focus.active = inputs.preview;
  focus.isOpen = inputs.preview >= 0;
  focus.isMap = view === 'index' || view === 'not-found';
  focus.isIndex = view === 'index';
  focus.isOnSheet = view === 'sheet';
  focus.read = focus.isOnSheet ? inputs.focus : -1;
  focus.selected = focus.isIndex ? inputs.selected : -1;
  focus.featured = inputs.featured;
  focus.shown =
    focus.isMap || focus.isOnSheet ? count : Math.min(inputs.featured, count);
  // Staggered entry: 0.42 s between two bodies, 0.7 s to raise each. The
  // rule's line and its planet are the same event, one clock rules both.
  focus.clock = inputs.reduced || view !== 'home' ? 99 : marksTime;
};

export const rising = (focus: PlanetFocus, i: number): number =>
  clamp((focus.clock - 0.15 - i * 0.42) / 0.7, 0, 1);

const isPreviewed = (focus: PlanetFocus, i: number): boolean =>
  focus.isOpen && focus.active === i;

export const isLively = (focus: PlanetFocus, i: number): boolean =>
  focus.hovered === i ||
  focus.selected === i ||
  i === focus.read ||
  isPreviewed(focus, i);

export const isHighlighted = (focus: PlanetFocus, i: number): boolean =>
  focus.hovered === i || isPreviewed(focus, i);

// The body aimed at never turns into a ghost behind the shadow.
const isAimed = (focus: PlanetFocus, i: number): boolean =>
  isPreviewed(focus, i) || i === focus.read || focus.selected === i;

// The selection (or the body read): a second ring, wider and held.
// Hovering is a flash, selecting is a lock; the two never merge.
export const isRinged = (focus: PlanetFocus, i: number): boolean =>
  focus.selected === i || (focus.isOnSheet && i === focus.read);

// A cold body: smaller, darker, nameless. No extra colour, no icon.
export const bodySize = (body: PlanetBody): number => {
  if (body.isCold) {
    return body.isLively ? 4.2 : 3.2;
  }
  return body.isLively ? 6.6 : 5.2;
};

export const bodyLight = (focus: PlanetFocus, body: PlanetBody): number => {
  const i = body.index;
  const isAimedAt = isAimed(focus, i);
  const previewed = focus.isOpen && focus.active !== i ? 0.2 : 1;
  const read = focus.isOnSheet && i !== focus.read ? 0.26 : 1;
  const shaded = isAimedAt ? 1 : 1 - 0.66 * body.shadow;
  const cold = body.isCold && !isAimedAt ? 0.4 : 1;
  return previewed * read * shaded * cold * body.coverFade * body.rising;
};

// Shown at rest, dimmed; hovering brings it to full. None behind the
// shadow, and while a preview is open only the aimed body keeps its
// name (the card already carries it).
export const isNamed = (focus: PlanetFocus, body: PlanetBody): boolean => {
  const i = body.index;
  if (focus.isOnSheet) {
    return i === focus.read;
  }
  if (body.isCold || body.rising < 0.75) {
    return false;
  }
  return focus.isOpen ? focus.active === i : !body.isShaded;
};
