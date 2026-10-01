import { CLOSE_UP_TURN_RATE } from '../../models/scene-constants.model';
import { NO_STATE, SceneState } from '../scene-state.rules';
import { orbitPaceOf, turnLimitOf, turnPaceOf } from './turning.rules';

const FRAME = 1 / 60;
const EASE = 1 - Math.pow(0.5, FRAME / 0.55);

const stateOf = (change: Partial<SceneState>): SceneState => ({
  ...NO_STATE,
  ...change,
});

describe('turning rules', () => {
  it('limits the turn of a close-up to its rate, frame by frame', () => {
    const closeUp = stateOf({ framing: 'close-up' });

    expect(turnLimitOf(closeUp, FRAME)).toBeCloseTo(
      CLOSE_UP_TURN_RATE * FRAME,
      12,
    );
  });

  it('leaves the other framings and the reduced motion unlimited', () => {
    const rest = stateOf({ framing: 'rest' });
    const approach = stateOf({ framing: 'approach' });
    const reduced = stateOf({ framing: 'close-up', reduced: true });

    expect(turnLimitOf(rest, FRAME)).toBe(Infinity);
    expect(turnLimitOf(approach, FRAME)).toBe(Infinity);
    expect(turnLimitOf(reduced, FRAME)).toBe(Infinity);
  });

  it('keeps the half-life while the turn stays under the limit', () => {
    const limit = CLOSE_UP_TURN_RATE * FRAME;

    expect(turnPaceOf(0.2, EASE, limit)).toBe(EASE);
    expect(turnPaceOf(-0.2, EASE, limit)).toBe(EASE);
    expect(turnPaceOf(0, EASE, limit)).toBe(EASE);
    expect(turnPaceOf(3, EASE, Infinity)).toBe(EASE);
  });

  it('slows the whole eased move so that the turn never passes the limit', () => {
    const limit = CLOSE_UP_TURN_RATE * FRAME;
    const gap = Math.PI;

    const pace = turnPaceOf(gap, EASE, limit);

    expect(pace).toBeLessThan(EASE);
    expect(gap * pace).toBeCloseTo(limit, 12);
    expect(turnPaceOf(-gap, EASE, limit)).toBe(pace);
  });

  it('turns at most the limit per second from a half-turn away, then eases out', () => {
    const limit = CLOSE_UP_TURN_RATE * FRAME;
    let gap = Math.PI;
    let peak = 0;
    for (let frame = 0; frame < 60 * 8; frame++) {
      const step = gap * turnPaceOf(gap, EASE, limit);
      peak = Math.max(peak, step * 60);
      gap -= step;
    }

    expect(peak).toBeLessThanOrEqual(CLOSE_UP_TURN_RATE + 1e-9);
    expect(Math.abs(gap)).toBeLessThan(0.01);
  });

  it('holds the orbits still in a close-up and lets them run elsewhere', () => {
    expect(orbitPaceOf(stateOf({ framing: 'close-up' }))).toBe(0);
    expect(orbitPaceOf(stateOf({ framing: 'rest' }))).toBe(1);
    expect(orbitPaceOf(stateOf({ framing: 'approach' }))).toBe(1);
  });
});
