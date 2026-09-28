import {
  GlassGesture,
  GlassIntent,
  GlassPress,
  GlassRelease,
} from '../models/glass-gesture.model';
import { glassGestureOf, glassIntentOf } from './glass-gesture.rules';

const OPEN_ON_BAR: GlassPress = {
  zone: 'bar',
  isFolded: false,
  canPull: true,
};

const pressOn = (overrides: Partial<GlassPress>): GlassPress => ({
  ...OPEN_ON_BAR,
  ...overrides,
});

const FOLDED = pressOn({ isFolded: true, canPull: false });
const ON_BODY = pressOn({ zone: 'body' });

const released = (overrides: Partial<GlassRelease>): GlassRelease => ({
  dy: 0,
  vy: 0,
  ...overrides,
});

describe('glassIntentOf', () => {
  it.each<{
    readonly name: string;
    readonly press: GlassPress;
    readonly dx: number;
    readonly dy: number;
    readonly intent: GlassIntent;
  }>([
    {
      name: 'waits while the finger stays within 6 px',
      press: OPEN_ON_BAR,
      dx: 3,
      dy: 5,
      intent: 'pending',
    },
    {
      name: 'pulls an open glass down from its bar',
      press: OPEN_ON_BAR,
      dx: 1,
      dy: 8,
      intent: 'pull',
    },
    {
      name: 'pulls an open glass down from its body',
      press: ON_BODY,
      dx: 0,
      dy: 10,
      intent: 'pull',
    },
    {
      name: 'leaves a downward drag to the native scroll when the press cannot pull',
      press: pressOn({ canPull: false }),
      dx: 0,
      dy: 10,
      intent: 'native',
    },
    {
      name: 'leaves a downward drag of the toolbar to the native scroll when it cannot pull',
      press: pressOn({ zone: 'toolbar', canPull: false }),
      dx: 0,
      dy: 10,
      intent: 'native',
    },
    {
      name: 'leaves an upward drag of an open bar to the native scroll',
      press: OPEN_ON_BAR,
      dx: 0,
      dy: -10,
      intent: 'native',
    },
    {
      name: 'leaves an upward drag of an open body to the native scroll',
      press: ON_BODY,
      dx: 0,
      dy: -10,
      intent: 'native',
    },
    {
      name: 'lifts a folded glass up from its bar',
      press: FOLDED,
      dx: 2,
      dy: -9,
      intent: 'lift',
    },
    {
      name: 'leaves a downward drag of a folded glass to the native scroll',
      press: FOLDED,
      dx: 0,
      dy: 9,
      intent: 'native',
    },
    {
      name: 'leaves a sideways drag of the toolbar to the native scroll',
      press: pressOn({ zone: 'toolbar' }),
      dx: -9,
      dy: 2,
      intent: 'native',
    },
    {
      name: 'leaves a sideways drag of the body to the native scroll',
      press: ON_BODY,
      dx: 9,
      dy: -2,
      intent: 'native',
    },
    {
      name: 'leaves a sideways drag of the bar to the native scroll',
      press: OPEN_ON_BAR,
      dx: 12,
      dy: 0,
      intent: 'native',
    },
  ])('$name', ({ press, dx, dy, intent }) => {
    expect(glassIntentOf(press, dx, dy)).toBe(intent);
  });
});

describe('glassGestureOf', () => {
  it.each<{
    readonly name: string;
    readonly intent: GlassIntent;
    readonly press: GlassPress;
    readonly release: Partial<GlassRelease>;
    readonly gesture: GlassGesture;
  }>([
    {
      name: 'folds a pull of 64 px',
      intent: 'pull',
      press: OPEN_ON_BAR,
      release: { dy: 64 },
      gesture: 'fold',
    },
    {
      name: 'leaves a pull of 63 px',
      intent: 'pull',
      press: OPEN_ON_BAR,
      release: { dy: 63 },
      gesture: 'none',
    },
    {
      name: 'folds a short pull let go faster than 0.6 px/ms downwards',
      intent: 'pull',
      press: OPEN_ON_BAR,
      release: { dy: 20, vy: 0.61 },
      gesture: 'fold',
    },
    {
      name: 'leaves a short pull let go at 0.6 px/ms',
      intent: 'pull',
      press: OPEN_ON_BAR,
      release: { dy: 20, vy: 0.6 },
      gesture: 'none',
    },
    {
      name: 'leaves a short pull let go fast upwards',
      intent: 'pull',
      press: OPEN_ON_BAR,
      release: { dy: 20, vy: -0.9 },
      gesture: 'none',
    },
    {
      name: 'unfolds a lift of 48 px',
      intent: 'lift',
      press: FOLDED,
      release: { dy: -48 },
      gesture: 'unfold',
    },
    {
      name: 'leaves a lift of 47 px',
      intent: 'lift',
      press: FOLDED,
      release: { dy: -47 },
      gesture: 'none',
    },
    {
      name: 'unfolds a short lift let go faster than 0.6 px/ms upwards',
      intent: 'lift',
      press: FOLDED,
      release: { dy: -12, vy: -0.7 },
      gesture: 'unfold',
    },
    {
      name: 'unfolds a folded glass on a tap of its bar',
      intent: 'pending',
      press: FOLDED,
      release: {},
      gesture: 'unfold',
    },
    {
      name: 'does nothing on a tap of an open bar',
      intent: 'pending',
      press: OPEN_ON_BAR,
      release: {},
      gesture: 'none',
    },
    {
      name: 'does nothing on a tap of a folded body',
      intent: 'pending',
      press: pressOn({ zone: 'body', isFolded: true }),
      release: {},
      gesture: 'none',
    },
    {
      name: 'never acts on a native drag',
      intent: 'native',
      press: OPEN_ON_BAR,
      release: { dy: 200, vy: 3 },
      gesture: 'none',
    },
  ])('$name', ({ intent, press, release, gesture }) => {
    expect(glassGestureOf(intent, press, released(release))).toBe(gesture);
  });
});
