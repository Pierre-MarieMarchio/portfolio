import { GlassPress, GlassRelease } from '../models/glass-gesture.model';
import {
  glassGestureOf,
  glassIntentOf,
  swipeFollowOf,
} from './glass-gesture.rules';

const OPEN_ON_BAR: GlassPress = {
  zone: 'bar',
  isFolded: false,
  canPull: true,
  isOnSideScroller: false,
};

const pressOn = (overrides: Partial<GlassPress>): GlassPress => ({
  ...OPEN_ON_BAR,
  ...overrides,
});

const FOLDED = pressOn({ isFolded: true, canPull: false });
const ON_BODY = pressOn({ zone: 'body' });

const released = (overrides: Partial<GlassRelease>): GlassRelease => ({
  dx: 0,
  dy: 0,
  vx: 0,
  vy: 0,
  ...overrides,
});

describe('glassIntentOf', () => {
  it('waits while the finger stays within 6 px', () => {
    expect(glassIntentOf(OPEN_ON_BAR, 3, 5)).toBe('pending');
  });

  it('pulls an open glass down when its press can pull', () => {
    expect(glassIntentOf(OPEN_ON_BAR, 1, 8)).toBe('pull');
    expect(glassIntentOf(ON_BODY, 0, 10)).toBe('pull');
  });

  it('leaves a downward drag to the native scroll when the press cannot pull', () => {
    expect(glassIntentOf(pressOn({ canPull: false }), 0, 10)).toBe('native');
    expect(
      glassIntentOf(pressOn({ zone: 'toolbar', canPull: false }), 0, 10),
    ).toBe('native');
  });

  it('leaves an upward drag of an open glass to the native scroll', () => {
    expect(glassIntentOf(OPEN_ON_BAR, 0, -10)).toBe('native');
    expect(glassIntentOf(ON_BODY, 0, -10)).toBe('native');
  });

  it('lifts a folded glass up from its bar', () => {
    expect(glassIntentOf(FOLDED, 2, -9)).toBe('lift');
    expect(glassIntentOf(FOLDED, 0, 9)).toBe('native');
  });

  it('swipes sideways from the toolbar or the body of an open glass', () => {
    expect(glassIntentOf(pressOn({ zone: 'toolbar' }), -9, 2)).toBe('swipe');
    expect(
      glassIntentOf(pressOn({ zone: 'body', canPull: false }), 9, -2),
    ).toBe('swipe');
  });

  it('leaves a sideways drag to an element that scrolls sideways itself', () => {
    const onScroller = pressOn({ zone: 'toolbar', isOnSideScroller: true });

    expect(glassIntentOf(onScroller, -12, 0)).toBe('native');
  });

  it('does not swipe from the bar, nor a folded glass', () => {
    expect(glassIntentOf(OPEN_ON_BAR, 12, 0)).toBe('native');
    expect(
      glassIntentOf(pressOn({ zone: 'body', isFolded: true }), 12, 0),
    ).toBe('native');
  });
});

describe('glassGestureOf', () => {
  it('folds a pull of 64 px or more', () => {
    expect(glassGestureOf('pull', OPEN_ON_BAR, released({ dy: 64 }))).toBe(
      'fold',
    );
    expect(glassGestureOf('pull', OPEN_ON_BAR, released({ dy: 63 }))).toBe(
      'none',
    );
  });

  it('folds a short pull let go faster than 0.6 px/ms downwards', () => {
    expect(
      glassGestureOf('pull', OPEN_ON_BAR, released({ dy: 20, vy: 0.61 })),
    ).toBe('fold');
    expect(
      glassGestureOf('pull', OPEN_ON_BAR, released({ dy: 20, vy: 0.6 })),
    ).toBe('none');
    expect(
      glassGestureOf('pull', OPEN_ON_BAR, released({ dy: 20, vy: -0.9 })),
    ).toBe('none');
  });

  it('unfolds a lift of 48 px or more, or let go faster than 0.6 px/ms upwards', () => {
    expect(glassGestureOf('lift', FOLDED, released({ dy: -48 }))).toBe(
      'unfold',
    );
    expect(glassGestureOf('lift', FOLDED, released({ dy: -47 }))).toBe('none');
    expect(
      glassGestureOf('lift', FOLDED, released({ dy: -12, vy: -0.7 })),
    ).toBe('unfold');
  });

  it('unfolds a folded glass on a tap of its bar, and nothing else', () => {
    expect(glassGestureOf('pending', FOLDED, released({ dx: 2 }))).toBe(
      'unfold',
    );
    expect(glassGestureOf('pending', OPEN_ON_BAR, released({}))).toBe('none');
    expect(
      glassGestureOf(
        'pending',
        pressOn({ zone: 'body', isFolded: true }),
        released({}),
      ),
    ).toBe('none');
  });

  it('turns a swipe to the left into next, to the right into previous', () => {
    expect(glassGestureOf('swipe', ON_BODY, released({ dx: -56 }))).toBe(
      'next',
    );
    expect(glassGestureOf('swipe', ON_BODY, released({ dx: 56 }))).toBe(
      'previous',
    );
    expect(glassGestureOf('swipe', ON_BODY, released({ dx: -55 }))).toBe(
      'none',
    );
  });

  it('asks a swipe to be more than 1.5 times as wide as it is tall', () => {
    expect(
      glassGestureOf('swipe', ON_BODY, released({ dx: -90, dy: 60 })),
    ).toBe('none');
    expect(
      glassGestureOf('swipe', ON_BODY, released({ dx: -91, dy: 60 })),
    ).toBe('next');
  });

  it('turns a short swipe let go faster than 0.5 px/ms into a step', () => {
    expect(
      glassGestureOf('swipe', ON_BODY, released({ dx: -20, vx: -0.51 })),
    ).toBe('next');
    expect(
      glassGestureOf('swipe', ON_BODY, released({ dx: 20, vx: 0.51 })),
    ).toBe('previous');
    expect(
      glassGestureOf('swipe', ON_BODY, released({ dx: -20, vx: 0.9 })),
    ).toBe('none');
  });

  it('never acts on a native drag', () => {
    expect(
      glassGestureOf('native', OPEN_ON_BAR, released({ dy: 200, vy: 3 })),
    ).toBe('none');
  });
});

describe('swipeFollowOf', () => {
  it('follows the finger less and less, never beyond 24 px', () => {
    expect(swipeFollowOf(0)).toBe(0);
    expect(swipeFollowOf(20)).toBeGreaterThan(0);
    expect(swipeFollowOf(20)).toBeLessThan(20);
    expect(swipeFollowOf(400)).toBeLessThanOrEqual(24);
    expect(swipeFollowOf(-4000)).toBeGreaterThanOrEqual(-24);
    expect(swipeFollowOf(-40)).toBe(-swipeFollowOf(40));
  });
});
