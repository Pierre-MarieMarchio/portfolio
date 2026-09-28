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

export const glassIntentOf = (
  press: GlassPress,
  dx: number,
  dy: number,
): GlassIntent => {
  if (Math.hypot(dx, dy) < DRAG_SLOP) {
    return 'pending';
  }
  if (Math.abs(dx) > Math.abs(dy)) {
    return 'native';
  }
  if (press.isFolded) {
    return press.zone === 'bar' && dy < 0 ? 'lift' : 'native';
  }
  return press.canPull && dy > 0 ? 'pull' : 'native';
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
    default: {
      return 'none';
    }
  }
};
