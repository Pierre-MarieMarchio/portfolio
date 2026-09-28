export type GlassZone = 'bar' | 'toolbar' | 'body';

export type GlassIntent = 'pending' | 'pull' | 'lift' | 'native';

export type GlassGesture = 'fold' | 'unfold' | 'none';

export interface GlassPress {
  readonly zone: GlassZone;
  readonly isFolded: boolean;
  readonly canPull: boolean;
}

export interface GlassRelease {
  readonly dy: number;
  readonly vy: number;
}

export interface GlassSurface {
  readonly isPhone: () => boolean;
  readonly isFolded: () => boolean;
  readonly isFollowing: () => boolean;
  readonly answer: (gesture: GlassGesture) => void;
}
