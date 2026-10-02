import { CLOSE_UP_TURN_RATE } from '../../models/scene-constants.model';
import { isCloseUp, SceneState } from '../scene-state.rules';

export const turnLimitOf = (state: SceneState, dt: number): number =>
  isCloseUp(state) && !state.reduced ? CLOSE_UP_TURN_RATE * dt : Infinity;

export const turnPaceOf = (gap: number, ease: number, limit: number): number =>
  gap === 0 ? ease : Math.min(ease, limit / Math.abs(gap));

export const orbitPaceOf = (state: SceneState): number =>
  isCloseUp(state) ? 0 : 1;
