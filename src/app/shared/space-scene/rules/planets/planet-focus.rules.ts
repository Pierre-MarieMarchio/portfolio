import { clamp } from '@app/core/helpers';
import { isAtRest, isCloseUp, SceneState } from '../scene-state.rules';

export interface PlanetFocus {
  emphasised: number;
  active: number;
  isOpen: boolean;
  isOverview: boolean;
  isTagged: boolean;
  isApproached: boolean;
  read: number;
  ringed: number;
  faintFrom: number;
  shown: number;
  clock: number;
}

export interface PlanetBody {
  rank: number;
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
  emphasised: -1,
  active: -1,
  isOpen: false,
  isOverview: false,
  isTagged: false,
  isApproached: false,
  read: -1,
  ringed: -1,
  faintFrom: 0,
  shown: 0,
  clock: 0,
});

export const focusOn = (
  focus: PlanetFocus,
  state: SceneState,
  count: number,
  marksTime: number,
): void => {
  const framing = state.framing;
  focus.emphasised = state.emphasised;
  focus.active = isCloseUp(state) ? state.framed : -1;
  focus.isOpen = isCloseUp(state);
  focus.isOverview = framing === 'overview';
  focus.isTagged = state.isTagged;
  focus.isApproached = framing === 'approach';
  focus.read = focus.isApproached ? state.framed : -1;
  focus.ringed = state.ringed;
  focus.faintFrom = state.faintFrom;
  focus.shown =
    focus.isOverview || focus.isApproached
      ? count
      : Math.min(state.faintFrom, count);
  focus.clock = state.reduced || !isAtRest(state) ? 99 : marksTime;
};

export const rising = (focus: PlanetFocus, i: number): number =>
  clamp((focus.clock - 0.15 - i * 0.42) / 0.7, 0, 1);

const isClosedUpOn = (focus: PlanetFocus, i: number): boolean =>
  focus.isOpen && focus.active === i;

export const isLively = (focus: PlanetFocus, i: number): boolean =>
  focus.emphasised === i ||
  focus.ringed === i ||
  i === focus.read ||
  isClosedUpOn(focus, i);

export const isHighlighted = (focus: PlanetFocus, i: number): boolean =>
  focus.emphasised === i || isClosedUpOn(focus, i);

const isAimed = (focus: PlanetFocus, i: number): boolean =>
  isClosedUpOn(focus, i) || i === focus.read || focus.ringed === i;

export const isRinged = (focus: PlanetFocus, i: number): boolean =>
  focus.ringed === i || (focus.isApproached && i === focus.read);

export const bodySize = (body: PlanetBody): number => {
  if (body.isCold) {
    return body.isLively ? 4.2 : 3.2;
  }
  return body.isLively ? 6.6 : 5.2;
};

export const bodyLight = (focus: PlanetFocus, body: PlanetBody): number => {
  const i = body.rank;
  const isAimedAt = isAimed(focus, i);
  const closeUpDim = focus.isOpen && focus.active !== i ? 0.2 : 1;
  const approachDim = focus.isApproached && i !== focus.read ? 0.26 : 1;
  const shaded = isAimedAt ? 1 : 1 - 0.66 * body.shadow;
  const cold = body.isCold && !isAimedAt ? 0.4 : 1;
  return (
    closeUpDim * approachDim * shaded * cold * body.coverFade * body.rising
  );
};

export const isNamed = (focus: PlanetFocus, body: PlanetBody): boolean => {
  const i = body.rank;
  if (focus.isApproached) {
    return i === focus.read;
  }
  if (body.isCold || body.rising < 0.75) {
    return false;
  }
  return focus.isOpen ? focus.active === i : !body.isShaded;
};
