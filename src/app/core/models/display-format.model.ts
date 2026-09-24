export type DisplayFormat = 'phone' | 'tablet' | 'desktop';

export type DisplayConditions = {
  readonly width: number;
  readonly height: number;
  readonly hasCoarsePointer: boolean;
  readonly cannotHover: boolean;
};
