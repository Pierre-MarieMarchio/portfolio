export type BottomSheetDetent = 'folded' | 'half' | 'full';

export interface BottomSheetStop {
  readonly detent: BottomSheetDetent;
  readonly at: number;
}

export interface BottomSheetRoom {
  readonly peek: number;
  readonly half: number;
  readonly end: number;
}

export interface BottomSheetSample {
  readonly top: number;
  readonly at: number;
}

export interface BottomSheetRelease {
  readonly speed: number;
  readonly pull: number;
}
