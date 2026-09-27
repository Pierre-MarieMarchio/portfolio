export type SwipeDirection = 'next' | 'previous';

export type GlassZone = 'bar' | 'toolbar' | 'body';

export type GlassIntent = 'pending' | 'pull' | 'lift' | 'swipe' | 'native';

export type GlassGesture = 'fold' | 'unfold' | SwipeDirection | 'none';

export interface GlassPress {
  readonly zone: GlassZone;
  readonly isFolded: boolean;
  readonly canPull: boolean;
  readonly isOnSideScroller: boolean;
}

export interface GlassRelease {
  readonly dx: number;
  readonly dy: number;
  readonly vx: number;
  readonly vy: number;
}

export interface GlassSurface {
  readonly isPhone: () => boolean;
  readonly isFolded: () => boolean;
  readonly isFollowing: () => boolean;
  readonly overflowX: (element: Element) => string;
  readonly answer: (gesture: GlassGesture) => void;
}
