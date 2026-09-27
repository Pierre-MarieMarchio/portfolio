import type {
  GlassGesture,
  GlassIntent,
  GlassPress,
  GlassRelease,
} from '../models/glass-gesture.model';

export const DRAG_SLOP = 6;
const FOLD_REACH = 64;
const UNFOLD_REACH = 48;
const FOLD_SPEED = 0.6;
const SWIPE_REACH = 56;
const SWIPE_SLANT = 1.5;
const SWIPE_SPEED = 0.5;
const SWIPE_FOLLOW = 24;

const sideIntentOf = (press: GlassPress): GlassIntent =>
  press.zone === 'bar' || press.isOnSideScroller || press.isFolded
    ? 'native'
    : 'swipe';

export const glassIntentOf = (
  press: GlassPress,
  dx: number,
  dy: number,
): GlassIntent => {
  if (Math.hypot(dx, dy) < DRAG_SLOP) {
    return 'pending';
  }
  if (Math.abs(dx) > Math.abs(dy)) {
    return sideIntentOf(press);
  }
  if (press.isFolded) {
    return press.zone === 'bar' && dy < 0 ? 'lift' : 'native';
  }
  return press.canPull && dy > 0 ? 'pull' : 'native';
};

const swipeOf = ({ dx, dy, vx }: GlassRelease): GlassGesture => {
  const isFlung = vx * dx > 0 && Math.abs(vx) > SWIPE_SPEED;
  const isFar = Math.abs(dx) >= SWIPE_REACH || isFlung;
  if (!isFar || Math.abs(dx) <= SWIPE_SLANT * Math.abs(dy)) {
    return 'none';
  }
  return dx < 0 ? 'next' : 'previous';
};

const pullOf = ({ dy, vy }: GlassRelease): GlassGesture =>
  dy >= FOLD_REACH || vy > FOLD_SPEED ? 'fold' : 'none';

const liftOf = ({ dy, vy }: GlassRelease): GlassGesture =>
  -dy >= UNFOLD_REACH || -vy > FOLD_SPEED ? 'unfold' : 'none';

export const glassGestureOf = (
  intent: GlassIntent,
  press: GlassPress,
  release: GlassRelease,
): GlassGesture => {
  switch (intent) {
    case 'pull': {
      return pullOf(release);
    }
    case 'lift': {
      return liftOf(release);
    }
    case 'pending': {
      return press.isFolded && press.zone === 'bar' ? 'unfold' : 'none';
    }
    case 'swipe': {
      return swipeOf(release);
    }
    default: {
      return 'none';
    }
  }
};

export const swipeFollowOf = (dx: number): number =>
  SWIPE_FOLLOW * Math.tanh(dx / (4 * SWIPE_FOLLOW));
